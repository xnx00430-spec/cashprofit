import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// GET - Statistiques globales des investissements
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
    const investments = await Investment.find({ userId: payload.userId }).lean();

    // Calculer les statistiques
    const now = new Date();
    let totalInvested = 0;
    let totalGains = 0;
    let activeInvestments = 0;
    let completedInvestments = 0;

    investments.forEach(inv => {
      totalInvested += inv.amount;
      
      const weeksPassed = Math.floor((now - new Date(inv.startDate)) / (7 * 24 * 60 * 60 * 1000));
      const activeWeeks = Math.min(weeksPassed, inv.maxWeeks);
      const weeklyGain = inv.amount * (inv.weeklyRate / 100);
      
      totalGains += weeklyGain * activeWeeks;

      if (inv.status === 'active' && weeksPassed < inv.maxWeeks) {
        activeInvestments++;
      } else if (weeksPassed >= inv.maxWeeks) {
        completedInvestments++;
      }
    });

    // Gains projetés
    const currentLevel = user.level;
    const levelConfig = getLevelConfig(currentLevel);
    const projectedWeeklyGain = totalInvested * (levelConfig.rate / 100);
    const projectedMonthlyGain = projectedWeeklyGain * 4;
    const projectedYearlyGain = projectedMonthlyGain * 12;

    return NextResponse.json({
      success: true,
      stats: {
        totalInvested,
        totalGains,
        activeInvestments,
        completedInvestments,
        totalInvestments: investments.length,
        currentLevel,
        currentWeeklyRate: levelConfig.rate,
        projectedGains: {
          weekly: projectedWeeklyGain,
          monthly: projectedMonthlyGain,
          yearly: projectedYearlyGain
        },
        roi: totalInvested > 0 ? ((totalGains / totalInvested) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get investment stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

function getLevelConfig(level) {
  const configs = {
    1: { rate: 10, duration: 4 },
    2: { rate: 15, duration: 2 },
    3: { rate: 20, duration: 2 },
    4: { rate: 25, duration: 2 },
    5: { rate: 30, duration: Infinity }
  };
  return configs[level] || configs[1];
}