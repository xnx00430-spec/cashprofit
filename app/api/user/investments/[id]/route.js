import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// GET - Détails d'un investissement spécifique
export async function GET(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const investment = await Investment.findOne({
      _id: params.id,
      userId: payload.userId
    }).lean();

    if (!investment) {
      return NextResponse.json(
        { success: false, message: 'Investissement non trouvé' },
        { status: 404 }
      );
    }

    // Calculer les gains détaillés
    const now = new Date();
    const startDate = new Date(investment.startDate);
    const weeksPassed = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000));
    const activeWeeks = Math.min(weeksPassed, investment.maxWeeks);
    
    const weeklyGain = investment.amount * (investment.weeklyRate / 100);
    const totalGains = weeklyGain * activeWeeks;
    const remainingWeeks = Math.max(0, investment.maxWeeks - weeksPassed);
    const projectedTotalGains = weeklyGain * investment.maxWeeks;

    // Historique hebdomadaire
    const weeklyHistory = [];
    for (let week = 1; week <= activeWeeks; week++) {
      const weekDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      weeklyHistory.push({
        week,
        date: weekDate,
        gain: weeklyGain,
        cumulative: weeklyGain * week
      });
    }

    return NextResponse.json({
      success: true,
      investment: {
        ...investment,
        stats: {
          weeksPassed,
          activeWeeks,
          remainingWeeks,
          weeklyGain,
          totalGains,
          projectedTotalGains,
          progressPercentage: (activeWeeks / investment.maxWeeks) * 100
        },
        weeklyHistory,
        isActive: investment.status === 'active' && weeksPassed < investment.maxWeeks,
        canWithdrawCapital: investment.level >= 2
      }
    });

  } catch (error) {
    console.error('Get investment details error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}