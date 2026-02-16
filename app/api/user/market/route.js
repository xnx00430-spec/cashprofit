// app/api/user/market/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// GET - Solde total + Projections temps réel
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
      .select('balance totalCommissions bonusParrainage totalInvested totalEarnings level')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les investissements actifs
    const investments = await Investment.find({
      userId: payload.userId,
      status: 'active'
    }).lean();

    // Calculer gains potentiels futurs
    const now = new Date();
    let totalCurrentGains = 0;
    let totalWeeklyGains = 0;

    investments.forEach(inv => {
      const weeksPassed = Math.floor((now - new Date(inv.startDate)) / (7 * 24 * 60 * 60 * 1000));
      const activeWeeks = Math.min(weeksPassed, inv.maxWeeks);
      const weeklyGain = inv.amount * (inv.weeklyRate / 100);
      
      totalCurrentGains += weeklyGain * activeWeeks;
      
      // Si pas encore terminé
      if (activeWeeks < inv.maxWeeks) {
        totalWeeklyGains += weeklyGain;
      }
    });

    // Solde total
    const totalBalance = user.balance + user.totalCommissions + user.bonusParrainage;

    // Projections (basées sur gains hebdo moyens)
    const projections = {
      hourly: totalWeeklyGains / (7 * 24),
      daily: totalWeeklyGains / 7,
      weekly: totalWeeklyGains,
      monthly: totalWeeklyGains * 4,
      yearly: totalWeeklyGains * 52
    };

    return NextResponse.json({
      success: true,
      market: {
        // Soldes
        totalBalance,
        breakdown: {
          gains: user.balance,
          commissions: user.totalCommissions,
          bonus: user.bonusParrainage
        },
        // Stats
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
        activeInvestments: investments.length,
        level: user.level,
        // Projections temps réel
        projections: {
          '1h': Math.round(projections.hourly),
          '24h': Math.round(projections.daily),
          '7j': Math.round(projections.weekly),
          '30j': Math.round(projections.monthly),
          '1an': Math.round(projections.yearly)
        },
        // Variation aujourd'hui (simulée pour démo)
        todayGains: Math.round(projections.daily * Math.random())
      }
    });

  } catch (error) {
    console.error('Get market error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}