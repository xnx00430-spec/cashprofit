import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Progression vers le niveau suivant
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
      .populate('referrals', 'status totalInvested')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const currentLevel = user.level;
    const nextLevel = currentLevel + 1;

    // Si déjà au niveau max
    if (currentLevel >= 5) {
      return NextResponse.json({
        success: true,
        currentLevel,
        isMaxLevel: true,
        message: 'Vous avez atteint le niveau maximum'
      });
    }

    // Exigences par niveau
    const requirements = {
      1: { referrals: 5, name: 'Niveau 2 - Intermédiaire' },
      2: { referrals: 15, name: 'Niveau 3 - Avancé' },
      3: { referrals: 30, name: 'Niveau 4 - Elite' },
      4: { referrals: 50, name: 'Niveau 5 - ULTIME VIP' }
    };

    const requirement = requirements[currentLevel];
    
    // Compter les filleuls actifs
    const totalReferrals = user.referrals.length;
    const activeReferrals = user.referrals.filter(r => 
      r.status === 'confirmed' && r.totalInvested >= 10000
    ).length;

    const progress = (activeReferrals / requirement.referrals) * 100;
    const remaining = Math.max(0, requirement.referrals - activeReferrals);
    const canLevelUp = activeReferrals >= requirement.referrals;

    // Avantages du niveau suivant
    const nextLevelBenefits = getLevelBenefits(nextLevel);

    return NextResponse.json({
      success: true,
      currentLevel: {
        level: currentLevel,
        name: getLevelName(currentLevel),
        weeklyRate: getLevelRate(currentLevel),
        benefits: getLevelBenefits(currentLevel)
      },
      nextLevel: {
        level: nextLevel,
        name: requirement.name,
        weeklyRate: getLevelRate(nextLevel),
        benefits: nextLevelBenefits
      },
      progress: {
        current: activeReferrals,
        required: requirement.referrals,
        remaining,
        percentage: Math.min(progress, 100),
        canLevelUp
      },
      referrals: {
        total: totalReferrals,
        active: activeReferrals,
        inactive: totalReferrals - activeReferrals
      }
    });

  } catch (error) {
    console.error('Get level progress error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Helpers
function getLevelName(level) {
  const names = {
    1: 'Niveau 1 - Démarrage',
    2: 'Niveau 2 - Intermédiaire',
    3: 'Niveau 3 - Avancé',
    4: 'Niveau 4 - Elite',
    5: 'Niveau 5 - ULTIME VIP'
  };
  return names[level] || 'Inconnu';
}

function getLevelRate(level) {
  const rates = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 30 };
  return rates[level] || 10;
}

function getLevelBenefits(level) {
  const benefits = {
    1: [
      'Gains 10% par semaine retirables',
      'Durée : 4 semaines',
      'Capital bloqué'
    ],
    2: [
      'Gains 15% par semaine retirables (2 semaines)',
      'Commissions 10% + 5% retirables À VIE',
      'Capital retirable avec remplaçant'
    ],
    3: [
      'Gains 20% par semaine retirables (2 semaines)',
      'Commissions 10% + 5% + 2.5% retirables',
      'Capital retirable avec remplaçant'
    ],
    4: [
      'Gains 25% par semaine retirables (2 semaines)',
      'Commissions 10% + 5% + 2.5% + 2% retirables',
      'Capital retirable avec remplaçant'
    ],
    5: [
      'Gains 30% par semaine retirables À VIE',
      'Toutes commissions (10 niveaux) retirables',
      'Capital retirable sans remplaçant',
      'Option investissement x5 en 2 mois'
    ]
  };
  return benefits[level] || [];
}