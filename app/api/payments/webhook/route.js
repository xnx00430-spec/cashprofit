// app/api/payments/webhook/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Opportunity from '@/models/Opportunity';
import { createNotification, NotificationTemplates, sendInvestmentEmail } from '@/lib/notifications';

const REFERRAL_BONUS = 10000;
const MAX_WEEKS = 52;

// Accéder au modèle PendingPayment
function getPendingPaymentModel() {
  const schema = new mongoose.Schema({
    depositId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  });
  return mongoose.models.PendingPayment || mongoose.model('PendingPayment', schema);
}

export async function POST(request) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    console.log('📥 PawaPay Webhook received:', JSON.stringify(data));

    await connectDB();
    const PendingPayment = getPendingPaymentModel();

    // PawaPay envoie un objet avec depositId et status
    const depositId = data.depositId;
    const status = data.status;
    const amount = parseFloat(data.amount) || 0;

    if (!depositId) {
      console.error('❌ No depositId in webhook');
      return NextResponse.json({ success: true, message: 'No depositId' });
    }

    console.log(`📋 Deposit ${depositId}: status=${status}, amount=${amount}`);

    // Chercher le paiement en attente
    const pending = await PendingPayment.findOne({ depositId });

    if (!pending) {
      console.error('❌ PendingPayment not found for depositId:', depositId);
      return NextResponse.json({ success: true, message: 'Pending not found' });
    }

    // Si déjà traité
    if (pending.status === 'completed') {
      console.log('✅ Already processed:', depositId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // FAILED ou autre statut non-COMPLETED
    if (status === 'FAILED') {
      pending.status = 'failed';
      await pending.save();
      console.log(`❌ Payment failed: ${depositId}`);
      return NextResponse.json({ success: true, message: 'Payment failed' });
    }

    // IN_RECONCILIATION - on attend
    if (status === 'IN_RECONCILIATION') {
      console.log(`⏳ Payment in reconciliation: ${depositId}`);
      return NextResponse.json({ success: true, message: 'In reconciliation' });
    }

    // Seul COMPLETED crée l'investissement
    if (status !== 'COMPLETED') {
      console.log(`⏳ Status not final: ${status}`);
      return NextResponse.json({ success: true, message: `Status: ${status}` });
    }

    // ==================== PAYMENT COMPLETED ====================

    const user = await User.findById(pending.userId);
    if (!user) {
      console.error('❌ User not found:', pending.userId);
      return NextResponse.json({ success: true, message: 'User not found' });
    }

    // Éviter doublon investissement
    const existingInvestment = await Investment.findOne({
      'paymentDetails.transactionId': depositId
    });
    if (existingInvestment) {
      console.log('✅ Investment already exists for:', depositId);
      pending.status = 'completed';
      await pending.save();
      return NextResponse.json({ success: true, message: 'Already exists' });
    }

    const opportunity = await Opportunity.findById(pending.opportunityId);
    if (!opportunity) {
      console.error('❌ Opportunity not found:', pending.opportunityId);
      return NextResponse.json({ success: true, message: 'Opportunity not found' });
    }

    // Calculs
    const investAmount = pending.amount;
    const baseRate = opportunity.baseRate;
    const bonusRate = user.level === 1 ? 0 : user.level === 2 ? 5 : 10;
    const finalRate = baseRate + bonusRate;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + MAX_WEEKS * 7 * 24 * 60 * 60 * 1000);
    const isFirstInvestment = user.totalInvested === 0;

    // Créer l'investissement
    const investment = new Investment({
      userId: user._id,
      opportunityId: opportunity._id,
      amount: investAmount,
      baseRate,
      level: user.level,
      type: 'regular',
      weeklyRate: finalRate,
      maxWeeks: MAX_WEEKS,
      startDate,
      endDate,
      multiplier: 1,
      status: 'active',
      paymentDetails: {
        provider: 'pawapay',
        transactionId: depositId,
        paidAt: new Date()
      }
    });

    await investment.save();

    // Mettre à jour user
    user.totalInvested += investAmount;
    user.activeInvestments += 1;

    // Premier investissement : initialiser le défi + firstInvestmentAmount
    if (isFirstInvestment) {
      user.firstInvestmentAmount = investAmount;
      user.currentLevelStartDate = new Date();
      const weeks = user.level === 1 ? 3 : 2;
      user.currentLevelDeadline = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
      user.currentLevelTarget = investAmount * 5;
      user.currentLevelCagnotte = 0;
    } else {
      // Investissements suivants comptent dans la cagnotte
      user.currentLevelCagnotte = (user.currentLevelCagnotte || 0) + investAmount;
    }

    // Vérifier passage de niveau
    if (user.canLevelUp()) {
      const oldLevel = user.level;
      user.levelUp();
      console.log(`🎉 User ${user.name} leveled up: ${oldLevel} → ${user.level}`);
      try {
        await createNotification(user._id,
          NotificationTemplates.levelUp(user.level, `Niveau ${user.level} atteint ! Bonus : +${user.getRateBonus()}%`)
        );
      } catch (e) { console.error('Notif error:', e); }
    }

    await user.save();

    // Mettre à jour stats opportunité
    await Opportunity.findByIdAndUpdate(opportunity._id, {
      $inc: { totalInvested: investAmount, activeInvestors: 1 }
    });

    console.log(`✅ Investment created: ${investment._id} - ${user.name} - ${investAmount} FCFA (${finalRate}%/sem)`);

    // 🔔 Notification in-app investissement confirmé
    try {
      await createNotification(user._id,
        NotificationTemplates.investmentConfirmed(investAmount, opportunity.name)
      );
    } catch (e) { console.error('Notif error:', e); }

    // ✉️ EMAIL: Investissement confirmé
    sendInvestmentEmail(user.email, user.name, {
      amount: investAmount,
      opportunityName: opportunity.name,
      rate: finalRate
    }).catch(console.error);

    // ==================== GESTION PARRAIN ====================
    if (user.referredBy) {
      try {
        const sponsor = await User.findById(user.referredBy);
        if (sponsor) {
          console.log(`📊 Parrain: ${sponsor.name}`);

          // Bonus 10,000 FCFA au premier investissement du filleul
          if (isFirstInvestment) {
            sponsor.bonusParrainage = (sponsor.bonusParrainage || 0) + REFERRAL_BONUS;
            console.log(`🎁 Bonus: +${REFERRAL_BONUS} FCFA pour ${sponsor.name}`);

            try {
              await createNotification(sponsor._id,
                NotificationTemplates.referralInvested(user.name, investAmount)
              );
              await createNotification(sponsor._id,
                NotificationTemplates.bonusEarned(REFERRAL_BONUS, `${user.name} a investi !`)
              );
            } catch (e) { console.error('Notif error:', e); }
          }

          // Cagnotte du parrain
          sponsor.currentLevelCagnotte = (sponsor.currentLevelCagnotte || 0) + investAmount;
          console.log(`📈 Cagnotte ${sponsor.name}: ${sponsor.currentLevelCagnotte}/${sponsor.currentLevelTarget}`);

          // Passage de niveau parrain
          if (sponsor.canLevelUp()) {
            const oldLevel = sponsor.level;
            sponsor.levelUp();
            console.log(`🎉 Parrain ${sponsor.name} level up: ${oldLevel} → ${sponsor.level}`);
            try {
              await createNotification(sponsor._id,
                NotificationTemplates.levelUp(sponsor.level, `Niveau ${sponsor.level} atteint !`)
              );
            } catch (e) { console.error('Notif error:', e); }
          }

          await sponsor.save();
        }
      } catch (refError) {
        console.error('Referral error:', refError);
      }
    }

    // Marquer comme complété
    pending.status = 'completed';
    await pending.save();

    return NextResponse.json({
      success: true,
      message: 'Investment created',
      investmentId: investment._id
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook error' },
      { status: 500 }
    );
  }
}