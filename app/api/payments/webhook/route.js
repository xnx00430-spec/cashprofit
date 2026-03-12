// app/api/payments/webhook/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Opportunity from '@/models/Opportunity';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/kkiapay';
import { createNotification, NotificationTemplates, sendInvestmentEmail } from '@/lib/notifications';

const REFERRAL_BONUS = 10000;
const MAX_WEEKS = 52;

// Modèle PendingPayment
function getPendingPaymentModel() {
  const schema = new mongoose.Schema({
    transactionId: { type: String, unique: true, sparse: true },
    depositId: { type: String, unique: true, sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    provider: { type: String, default: 'kkiapay' },
    createdAt: { type: Date, default: Date.now }
  });
  return mongoose.models.PendingPayment || mongoose.model('PendingPayment', schema);
}

// ==================== MISE À JOUR DES TAUX APRÈS LEVEL UP ====================
// Fige les gains accumulés à l'ancien taux, puis applique le nouveau taux à partir de maintenant
async function updateInvestmentRatesAfterLevelUp(userId, newLevel) {
  const bonusRate = newLevel === 1 ? 0 : newLevel === 2 ? 5 : 10;
  const now = new Date();

  const activeInvestments = await Investment.find({ userId, status: 'active' });

  for (const inv of activeInvestments) {
    const newRate = inv.baseRate + bonusRate;

    if (inv.weeklyRate !== newRate) {
      // 1. Calculer les gains accumulés jusqu'à maintenant avec l'ANCIEN taux
      const msElapsed = now - new Date(inv.startDate);
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), inv.maxWeeks);
      const oldWeeklyGain = inv.amount * (inv.weeklyRate / 100);
      const gainsAtOldRate = oldWeeklyGain * activeWeeks;

      // 2. Figer ces gains dans lastSyncedEarnings
      inv.lastSyncedEarnings = gainsAtOldRate;

      // 3. Reset startDate à maintenant pour que le nouveau taux parte de maintenant
      const remainingWeeks = Math.max(inv.maxWeeks - activeWeeks, 0);
      inv.startDate = now;
      inv.maxWeeks = Math.ceil(remainingWeeks);
      inv.endDate = new Date(now.getTime() + remainingWeeks * 7 * 24 * 60 * 60 * 1000);

      // 4. Appliquer le nouveau taux
      inv.weeklyRate = newRate;
      inv.level = newLevel;

      await inv.save();
      console.log(`📈 Investment ${inv._id}: ${inv.weeklyRate - bonusRate + (newLevel === 2 ? 0 : (newLevel >= 3 ? 5 : 0))}% → ${newRate}% | Gains figés: ${gainsAtOldRate.toFixed(2)} F | Remaining: ${remainingWeeks.toFixed(1)} weeks`);
    }
  }

  if (activeInvestments.length > 0) {
    console.log(`✅ Updated ${activeInvestments.length} investments for user ${userId} to level ${newLevel} (+${bonusRate}%)`);
  }
}

// ==================== LOGIQUE COMMUNE : CRÉER INVESTISSEMENT ====================
export async function createInvestmentFromPayment({ transactionId, userId, opportunityId, amount, provider = 'kkiapay' }) {

  // Anti-doublon
  const existingInvestment = await Investment.findOne({
    'paymentDetails.transactionId': transactionId
  });
  if (existingInvestment) {
    console.log(`✅ Investment already exists for: ${transactionId}`);
    return { success: true, alreadyExists: true, investmentId: existingInvestment._id };
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('❌ User not found:', userId);
    return { success: false, error: 'User not found' };
  }

  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    console.error('❌ Opportunity not found:', opportunityId);
    return { success: false, error: 'Opportunity not found' };
  }

  // Calculs
  const investAmount = amount;
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
    lastSyncedEarnings: 0,
    paymentDetails: {
      provider,
      transactionId,
      paidAt: new Date()
    }
  });

  await investment.save();

  // Mettre à jour user
  user.totalInvested += investAmount;
  user.activeInvestments += 1;

  if (isFirstInvestment) {
    user.firstInvestmentAmount = investAmount;
    user.currentLevelStartDate = new Date();
    const weeks = user.level === 1 ? 3 : 2;
    user.currentLevelDeadline = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
    user.currentLevelTarget = investAmount * 5;
    user.currentLevelCagnotte = 0;
  } else {
    user.currentLevelCagnotte = (user.currentLevelCagnotte || 0) + investAmount;
  }

  // Passage de niveau
  if (user.canLevelUp()) {
    const oldLevel = user.level;
    user.levelUp();
    console.log(`🎉 User ${user.name} leveled up: ${oldLevel} → ${user.level}`);

    // Figer les gains à l'ancien taux et appliquer le nouveau taux à partir de maintenant
    await updateInvestmentRatesAfterLevelUp(user._id, user.level);

    try {
      await createNotification(user._id,
        NotificationTemplates.levelUp(user.level, `Niveau ${user.level} atteint ! Bonus : +${user.getRateBonus()}%`)
      );
    } catch (e) { console.error('Notif error:', e); }
  }

  await user.save();

  // Stats opportunité
  await Opportunity.findByIdAndUpdate(opportunity._id, {
    $inc: { totalInvested: investAmount, activeInvestors: 1 }
  });

  console.log(`✅ Investment created: ${investment._id} - ${user.name} - ${investAmount} FCFA (${finalRate}%/sem)`);

  // 🔔 Notification in-app
  try {
    await createNotification(user._id,
      NotificationTemplates.investmentConfirmed(investAmount, opportunity.name)
    );
  } catch (e) { console.error('Notif error:', e); }

  // ✉️ EMAIL
  if (user.email) {
    sendInvestmentEmail(user.email, user.name, {
      amount: investAmount,
      opportunityName: opportunity.name,
      rate: finalRate
    }).catch(console.error);
  }

  // ==================== GESTION PARRAIN ====================
  if (user.referredBy) {
    try {
      const sponsor = await User.findById(user.referredBy);
      if (sponsor) {
        if (isFirstInvestment) {
          sponsor.bonusParrainage = (sponsor.bonusParrainage || 0) + REFERRAL_BONUS;
          try {
            await createNotification(sponsor._id, NotificationTemplates.referralInvested(user.name, investAmount));
            await createNotification(sponsor._id, NotificationTemplates.bonusEarned(REFERRAL_BONUS, `${user.name} a investi !`));
          } catch (e) { console.error('Notif error:', e); }
        }

        sponsor.currentLevelCagnotte = (sponsor.currentLevelCagnotte || 0) + investAmount;

        if (sponsor.canLevelUp()) {
          const oldLevel = sponsor.level;
          sponsor.levelUp();

          // Figer les gains du parrain aussi
          await updateInvestmentRatesAfterLevelUp(sponsor._id, sponsor.level);

          try {
            await createNotification(sponsor._id, NotificationTemplates.levelUp(sponsor.level, `Niveau ${sponsor.level} atteint !`));
          } catch (e) { console.error('Notif error:', e); }
        }

        await sponsor.save();
      }
    } catch (refError) {
      console.error('Referral error:', refError);
    }
  }

  return { success: true, investmentId: investment._id, amount: investAmount, rate: finalRate };
}

// ==================== WEBHOOK POST ====================
export async function POST(request) {
  try {
    if (!verifyWebhookSignature(request)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    const body = await request.text();
    const data = JSON.parse(body);
    console.log('📥 KkiaPay Webhook received:', JSON.stringify(data));

    await connectDB();
    const PendingPayment = getPendingPaymentModel();

    const transactionId = data.transactionId;
    const status = data.status;

    if (!transactionId) {
      console.error('❌ No transactionId in webhook');
      return NextResponse.json({ success: true, message: 'No transactionId' });
    }

    if (status !== 'SUCCESS' && status !== 'COMPLETED') {
      console.log(`⏳ Transaction ${transactionId} status: ${status}`);
      if (status === 'FAILED') {
        await PendingPayment.findOneAndUpdate(
          { $or: [{ transactionId }, { depositId: transactionId }] },
          { status: 'failed' }
        );
      }
      return NextResponse.json({ success: true, message: `Status: ${status}` });
    }

    const pending = await PendingPayment.findOne({
      $or: [{ transactionId }, { depositId: transactionId }]
    });

    if (!pending) {
      console.error('❌ PendingPayment not found for:', transactionId);
      return NextResponse.json({ success: true, message: 'Pending not found' });
    }

    if (pending.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const verification = await verifyTransaction(transactionId);
    if (!verification.success || verification.status !== 'SUCCESS') {
      console.error('❌ KkiaPay verification failed:', verification);
      return NextResponse.json({ success: true, message: 'Verification failed' });
    }

    if (verification.amount < pending.amount) {
      console.error(`❌ Amount mismatch: paid=${verification.amount}, expected=${pending.amount}`);
      return NextResponse.json({ success: true, message: 'Amount mismatch' });
    }

    const result = await createInvestmentFromPayment({
      transactionId,
      userId: pending.userId,
      opportunityId: pending.opportunityId,
      amount: pending.amount,
      provider: 'kkiapay'
    });

    pending.status = 'completed';
    pending.transactionId = transactionId;
    await pending.save();

    return NextResponse.json({
      success: true,
      message: result.alreadyExists ? 'Already exists' : 'Investment created',
      investmentId: result.investmentId
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ success: false, message: 'Webhook error' }, { status: 500 });
  }
}