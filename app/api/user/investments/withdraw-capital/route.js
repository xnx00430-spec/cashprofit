import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// POST - Retirer son capital en trouvant un remplaçant
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { investmentId, replacementUserId } = await request.json();

    // Validation
    if (!investmentId || !replacementUserId) {
      return NextResponse.json(
        { success: false, message: 'Données manquantes' },
        { status: 400 }
      );
    }

    await connectDB();

    // Récupérer l'utilisateur et son investissement
    const user = await User.findById(payload.userId).populate('referrals');
    const investment = await Investment.findOne({
      _id: investmentId,
      userId: payload.userId,
      status: 'active'
    });

    if (!investment) {
      return NextResponse.json(
        { success: false, message: 'Investissement non trouvé ou inactif' },
        { status: 404 }
      );
    }

    // Vérifier le niveau (niveau 1 = pas de retrait capital)
    if (investment.level < 2) {
      return NextResponse.json(
        { success: false, message: 'Retrait capital disponible à partir du niveau 2' },
        { status: 403 }
      );
    }

    // Vérifier le remplaçant
    const replacement = await User.findById(replacementUserId);
    if (!replacement) {
      return NextResponse.json(
        { success: false, message: 'Remplaçant non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le remplaçant est bien un filleul
    const isReferral = user.referrals.some(ref => ref._id.toString() === replacementUserId);
    if (!isReferral) {
      return NextResponse.json(
        { success: false, message: 'Le remplaçant doit être l\'un de vos filleuls' },
        { status: 400 }
      );
    }

    // Vérifier que le remplaçant a investi le même montant ou plus
    const replacementInvestment = await Investment.findOne({
      userId: replacementUserId,
      amount: { $gte: investment.amount },
      status: 'active'
    });

    if (!replacementInvestment) {
      return NextResponse.json(
        { success: false, message: 'Le remplaçant doit investir au moins ' + investment.amount + ' FCFA' },
        { status: 400 }
      );
    }

    // Transférer le réseau au remplaçant
    const userReferrals = user.referrals.map(ref => ref._id);
    
    // Le remplaçant hérite des filleuls de l'utilisateur
    replacement.referrals = [...new Set([...replacement.referrals, ...userReferrals])];
    replacement.level = investment.level; // Hérite du niveau
    await replacement.save();

    // L'utilisateur perd son réseau et ses investissements actifs
    user.referrals = [];
    user.level = 1; // Retour au niveau 1
    await user.save();

    // Marquer l'investissement comme retiré
    investment.status = 'withdrawn';
    investment.withdrawnAt = new Date();
    investment.replacedBy = replacementUserId;
    await investment.save();

    // Créer une transaction de retrait (à implémenter avec le modèle Withdrawal)
    // TODO: Créer un Withdrawal record

    return NextResponse.json({
      success: true,
      message: 'Capital retiré avec succès',
      withdrawal: {
        amount: investment.amount,
        replacedBy: replacement.name,
        date: new Date()
      }
    });

  } catch (error) {
    console.error('Withdraw capital error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du retrait' },
      { status: 500 }
    );
  }
}