import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    // Vérifier l'authentification - AJOUTE AWAIT
    const payload = await verifyAuth();

    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    // Récupérer l'utilisateur
    const user = await User.findById(payload.userId)
      .populate('referredBy', 'name email sponsorCode')
      .populate('referrals', 'name email sponsorCode level totalInvested');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        status: user.status,
        blockReason: user.blockReason,
        role: user.role,
        sponsorCode: user.sponsorCode,
        referredBy: user.referredBy,
        referredByCode: user.referredByCode,
        referrals: user.referrals,
        level: user.level,
        balance: user.balance,
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
        totalWithdrawn: user.totalWithdrawn,
        totalCommissions: user.totalCommissions,
        kyc: user.kyc,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}