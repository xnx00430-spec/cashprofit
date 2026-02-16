// app/api/user/referrals/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// Calculer les gains live d'un utilisateur
function calculateLiveEarnings(investments) {
  const now = new Date();
  let total = 0;
  for (const inv of investments) {
    const startDate = new Date(inv.startDate);
    const maxWeeks = inv.maxWeeks || 52;
    const msElapsed = now - startDate;
    const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
    const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
    const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
    total += weeklyEarning * activeWeeks;
  }
  return Math.round(total * 100) / 100;
}

// Calculer les commissions live récursives
async function calculateLiveCommissions(userId) {
  const referrals = await User.find({ referredBy: userId }).lean();
  if (referrals.length === 0) return 0;

  let totalCommission = 0;
  for (const referral of referrals) {
    const refInvestments = await Investment.find({ userId: referral._id, status: 'active' }).lean();
    const refEarnings = calculateLiveEarnings(refInvestments);
    const refCommissions = await calculateLiveCommissions(referral._id);
    totalCommission += (refEarnings + refCommissions) * 0.10;
  }
  return totalCommission;
}

// GET - Liste des filleuls directs avec stats live
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId)
      .populate({
        path: 'referrals',
        select: 'name email phone avatar status level totalInvested createdAt',
        options: { sort: { createdAt: -1 } }
      });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Calculer les stats LIVE pour chaque filleul
    const referralsWithStats = await Promise.all(
      user.referrals.map(async (referral) => {
        // Gains live du filleul
        const refInvestments = await Investment.find({
          userId: referral._id,
          status: 'active'
        }).lean();
        const liveEarnings = calculateLiveEarnings(refInvestments);

        // Commissions live du filleul (ses propres filleuls)
        const refCommissions = await calculateLiveCommissions(referral._id);

        // Total gains du filleul (bénéfices + commissions)
        const totalGains = liveEarnings + refCommissions;

        // Votre commission sur ce filleul (10% de ses gains totaux)
        const yourCommission = Math.round(totalGains * 0.10 * 100) / 100;

        // Sous-filleuls
        const subReferrals = await User.countDocuments({ referredBy: referral._id });

        // Séparer nom en firstName/lastName pour la page
        const nameParts = (referral.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          _id: referral._id,
          name: referral.name,
          firstName,
          lastName,
          email: referral.email,
          phone: referral.phone,
          avatar: referral.avatar,
          status: referral.status,
          level: referral.level || 1,
          totalInvested: referral.totalInvested || 0,
          totalEarnings: liveEarnings,
          totalCommissions: refCommissions,
          totalGains,
          yourCommission,
          subReferrals,
          createdAt: referral.createdAt
        };
      })
    );

    // Stats globales LIVE
    const totalReferrals = user.referrals.length;
    const activeReferrals = user.referrals.filter(r => (r.totalInvested || 0) > 0).length;
    const totalNetworkInvestment = user.referrals.reduce((sum, r) => sum + (r.totalInvested || 0), 0);

    // Commissions live totales
    const liveCommissions = await calculateLiveCommissions(user._id);

    return NextResponse.json({
      success: true,
      referrals: referralsWithStats,
      stats: {
        totalReferrals,
        activeReferrals,
        pendingReferrals: totalReferrals - activeReferrals,
        totalNetworkInvestment,
        totalCommissions: Math.round(liveCommissions * 100) / 100,
        bonusEarned: user.bonusParrainage || 0,
        sponsorCode: user.sponsorCode
      }
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}