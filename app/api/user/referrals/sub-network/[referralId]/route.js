// app/api/user/referrals/sub-network/[referralId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { referralId } = params;

    await connectDB();

    // Vérifier que l'user est bien le parrain du filleul demandé
    const referral = await User.findById(referralId);
    
    if (!referral) {
      return NextResponse.json(
        { success: false, message: 'Filleul non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien son filleul direct
    if (referral.referredBy?.toString() !== payload.userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer tous les filleuls du filleul (sous-réseau)
    const subReferrals = await User.find({ 
      referredBy: referralId 
    }).select('firstName lastName email totalInvested totalEarnings createdAt');

    return NextResponse.json({
      success: true,
      subReferrals: subReferrals.map(sub => ({
        _id: sub._id,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        totalInvested: sub.totalInvested || 0,
        totalEarnings: sub.totalEarnings || 0,
        createdAt: sub.createdAt
      }))
    });

  } catch (error) {
    console.error('Sub-network error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}