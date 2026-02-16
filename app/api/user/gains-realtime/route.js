// app/api/user/gains-realtime/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

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

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer tous les investissements actifs
    const investments = await Investment.find({ 
      userId: user._id, 
      status: 'active' 
    }).populate('opportunityId');

    let totalGainsRealtime = 0;
    let investmentsDetails = [];

    const now = new Date();

    for (const inv of investments) {
      // Vérifier si investissement toujours actif
      if (!inv.isActive()) continue;

      // Calculer le temps écoulé depuis le début
      const startTime = new Date(inv.startDate).getTime();
      const currentTime = now.getTime();
      const secondsPassed = (currentTime - startTime) / 1000;

      // Récupérer le taux de base de l'opportunité
      const baseRate = inv.opportunityId?.rateLevel1 || inv.opportunityId?.rate || 10;

      // Calculer le bonus selon le niveau de l'user
      let levelBonus = 0;
      if (user.level === 1) {
        levelBonus = 0;
      } else if (user.level === 2) {
        levelBonus = 5;
      } else if (user.level >= 3) {
        levelBonus = 10;
      }

      // Taux final pour cet investissement
      const finalRate = baseRate + levelBonus;
      const rateDecimal = finalRate / 100;

      // Gains par semaine pour cet investissement
      const weeklyGains = inv.amount * rateDecimal;

      // Gains par seconde
      const gainsPerSecond = weeklyGains / (7 * 24 * 60 * 60);

      // Calculer nombre de semaines complètes écoulées
      const weeksElapsed = Math.floor(secondsPassed / (7 * 24 * 60 * 60));

      // Limiter au nombre maximum de semaines
      const activeWeeks = Math.min(weeksElapsed, inv.maxWeeks);

      // Calculer les gains accumulés
      // Gains des semaines complètes
      const completeWeeksGains = activeWeeks * weeklyGains;

      // Gains de la semaine en cours (si pas terminé)
      let currentWeekGains = 0;
      if (activeWeeks < inv.maxWeeks) {
        const secondsInCurrentWeek = secondsPassed % (7 * 24 * 60 * 60);
        currentWeekGains = gainsPerSecond * secondsInCurrentWeek;
      }

      // Total gains pour cet investissement
      const investmentTotalGains = completeWeeksGains + currentWeekGains;

      totalGainsRealtime += investmentTotalGains;

      investmentsDetails.push({
        investmentId: inv._id,
        opportunityName: inv.opportunityId?.title || 'Opportunité',
        amount: inv.amount,
        baseRate,
        levelBonus,
        finalRate,
        secondsPassed: Math.floor(secondsPassed),
        weeksElapsed: activeWeeks,
        maxWeeks: inv.maxWeeks,
        gainsAccumulated: investmentTotalGains
      });
    }

    return NextResponse.json({
      success: true,
      totalGains: totalGainsRealtime,
      userLevel: user.level,
      activeInvestments: investments.length,
      investments: investmentsDetails,
      calculatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Gains realtime error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}