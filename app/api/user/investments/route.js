// app/api/user/investments/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Opportunity from '@/models/Opportunity';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

const REFERRAL_BONUS = 10000;
const MAX_WEEKS = 52;
const REFERRER_CUT = 0.10;

// ==================== GET - LISTE DES INVESTISSEMENTS ====================
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    await connectDB();

    const user = await User.findById(payload.userId).select('referredBy').lean();
    const hasReferrer = !!user?.referredBy;

    const query = { userId: payload.userId };
    if (status) query.status = status;

    const investments = await Investment.find(query)
      .populate('opportunityId', 'name slug category duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Investment.countDocuments(query);

    const stats = await Investment.aggregate([
      { $match: { userId: payload.userId } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const investmentsWithEarnings = investments.map(inv => {
      const now = new Date();
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || MAX_WEEKS;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
      
      // Gains bruts totaux depuis le début
      const grossEarnings = weeklyEarning * activeWeeks;
      
      // Gains déjà synchronisés en DB
      const lastSynced = inv.lastSyncedEarnings || 0;
      
      // Gains pas encore en DB (pour le sync au moment du retrait)
      const unsyncedGross = Math.max(grossEarnings - lastSynced, 0);
      const unsyncedNet = hasReferrer 
        ? unsyncedGross * (1 - REFERRER_CUT) 
        : unsyncedGross;

      // ========== CLÉ : gains nets TOTAUX depuis le début ==========
      // C'est ce que le frontend affiche comme "gains live"
      const totalNetEarnings = hasReferrer 
        ? grossEarnings * (1 - REFERRER_CUT) 
        : grossEarnings;

      const grossTotal = weeklyEarning * maxWeeks;
      const totalReturn = hasReferrer ? grossTotal * (1 - REFERRER_CUT) : grossTotal;
      
      const progress = maxWeeks > 0 ? Math.min((weeksElapsed / maxWeeks) * 100, 100) : 0;
      const endDate = new Date(inv.endDate);
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

      return {
        id: inv._id,
        amount: inv.amount,
        rate: inv.weeklyRate,
        baseRate: inv.baseRate,
        weeklyRate: inv.weeklyRate,
        maxWeeks: inv.maxWeeks,
        level: inv.level,
        startDate: inv.startDate,
        endDate: inv.endDate,
        status: inv.status,
        // ========== GAINS NETS TOTAUX (ne repart jamais à 0) ==========
        currentEarnings: Math.round(totalNetEarnings * 100) / 100,
        // Gains non encore synchronisés en DB (pour usage interne)
        unsyncedEarnings: Math.round(unsyncedNet * 100) / 100,
        grossEarnings: Math.round(grossEarnings * 100) / 100,
        referrerCut: hasReferrer ? Math.round(grossEarnings * REFERRER_CUT * 100) / 100 : 0,
        weeklyEarning: Math.round(weeklyEarning),
        totalReturn: Math.round(totalReturn),
        progress: Math.round(progress * 100) / 100,
        daysRemaining,
        opportunity: inv.opportunityId ? {
          id: inv.opportunityId._id,
          name: inv.opportunityId.name,
          slug: inv.opportunityId.slug,
          category: inv.opportunityId.category
        } : null,
        paymentDetails: inv.paymentDetails || null
      };
    });

    return NextResponse.json({
      success: true,
      hasReferrer,
      investments: investmentsWithEarnings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        active: stats.find(s => s._id === 'active')?.total || 0,
        activeCount: stats.find(s => s._id === 'active')?.count || 0,
        completed: stats.find(s => s._id === 'completed')?.total || 0,
        completedCount: stats.find(s => s._id === 'completed')?.count || 0
      }
    });

  } catch (error) {
    console.error('Get investments error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ==================== POST - CRÉER UN INVESTISSEMENT ====================
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { opportunityId, amount } = await request.json();

    if (!opportunityId || !amount) {
      return NextResponse.json(
        { success: false, message: 'Opportunité et montant requis' },
        { status: 400 }
      );
    }

    if (amount < 10000) {
      return NextResponse.json(
        { success: false, message: 'Montant minimum : 10,000 FCFA' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.status === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'Compte bloqué' },
        { status: 403 }
      );
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity || opportunity.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Opportunité non disponible' },
        { status: 400 }
      );
    }

    if (amount < opportunity.minInvestment || amount > opportunity.maxInvestment) {
      return NextResponse.json({
        success: false,
        message: `Montant entre ${opportunity.minInvestment.toLocaleString()} et ${opportunity.maxInvestment.toLocaleString()} FCFA`
      }, { status: 400 });
    }

    const baseRate = opportunity.baseRate;
    const bonus = user.getRateBonus();
    const finalRate = baseRate + bonus;
    const maxWeeks = MAX_WEEKS;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + maxWeeks * 7 * 24 * 60 * 60 * 1000);
    const isFirstInvestment = user.totalInvested === 0;

    const investment = await Investment.create({
      userId: user._id,
      opportunityId: opportunity._id,
      amount, baseRate,
      weeklyRate: finalRate,
      maxWeeks,
      level: user.level,
      type: 'regular',
      startDate, endDate,
      status: 'active',
      lastSyncedEarnings: 0
    });

    user.totalInvested += amount;
    user.activeInvestments += 1;

    if (!isFirstInvestment) {
      user.currentLevelCagnotte = (user.currentLevelCagnotte || 0) + amount;
    }

    if (user.canLevelUp()) {
      const oldLevel = user.level;
      user.levelUp();
      try {
        await createNotification(user._id,
          NotificationTemplates.levelUp(user.level, `Niveau ${user.level} atteint ! Bonus : +${user.getRateBonus()}%`)
        );
      } catch (e) { console.error('Notif error:', e); }
    }

    if (user.referredBy) {
      try {
        const sponsor = await User.findById(user.referredBy);
        if (sponsor) {
          if (isFirstInvestment) {
            sponsor.bonusParrainage = (sponsor.bonusParrainage || 0) + REFERRAL_BONUS;
            try {
              await createNotification(sponsor._id,
                NotificationTemplates.referralInvested(user.name, amount)
              );
              await createNotification(sponsor._id,
                NotificationTemplates.bonusEarned(REFERRAL_BONUS, `${user.name} a investi !`)
              );
            } catch (e) { console.error('Notif error:', e); }
          }

          sponsor.currentLevelCagnotte = (sponsor.currentLevelCagnotte || 0) + amount;

          if (sponsor.canLevelUp()) {
            sponsor.levelUp();
            try {
              await createNotification(sponsor._id,
                NotificationTemplates.levelUp(sponsor.level, `Niveau ${sponsor.level} atteint !`)
              );
            } catch (e) { console.error('Notif error:', e); }
          }

          await sponsor.save();
        }
      } catch (e) { console.error('Referral error:', e); }
    }

    await user.save();

    opportunity.totalInvested = (opportunity.totalInvested || 0) + amount;
    opportunity.activeInvestors += 1;
    await opportunity.save();

    try {
      await createNotification(user._id,
        NotificationTemplates.investmentSuccess(amount, opportunity.name)
      );
    } catch (e) { console.error('Notif error:', e); }

    return NextResponse.json({
      success: true,
      message: 'Investissement créé avec succès',
      investment: {
        id: investment._id, amount: investment.amount,
        opportunity: opportunity.name, baseRate, bonus, finalRate, maxWeeks,
        endDate: investment.endDate
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Investment error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}