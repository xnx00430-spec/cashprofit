// app/api/user/investments/increase/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// POST - Augmenter le capital d'un investissement existant
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { investmentId, additionalAmount } = await request.json();

    // Validation
    if (!investmentId || !additionalAmount || additionalAmount < 1000) {
      return NextResponse.json(
        { success: false, message: 'Montant minimum : 1,000 FCFA' },
        { status: 400 }
      );
    }

    await connectDB();

    const investment = await Investment.findOne({
      _id: investmentId,
      userId: payload.userId,
      status: 'active'
    });

    if (!investment) {
      return NextResponse.json(
        { success: false, message: 'Investissement non trouvé' },
        { status: 404 }
      );
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Augmenter le capital
    investment.amount += additionalAmount;
    await investment.save();

    // Mettre à jour total investi user
    user.totalInvested += additionalAmount;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Capital augmenté avec succès',
      investment: {
        id: investment._id,
        newAmount: investment.amount,
        addedAmount: additionalAmount,
        weeklyRate: investment.weeklyRate,
        newWeeklyGains: investment.amount * (investment.weeklyRate / 100)
      }
    });

  } catch (error) {
    console.error('Increase investment error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'augmentation' },
      { status: 500 }
    );
  }
}