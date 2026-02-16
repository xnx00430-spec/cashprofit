// app/api/admin/users/[userId]/network/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Réseau d'affiliés d'un utilisateur (ADMIN ONLY)
export async function GET(request, context) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Next.js 15 : params doit être await
    const { userId } = await context.params;

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const referrals = await User.find({ referredBy: userId })
      .select('name email level totalInvested balance status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const networkStats = {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === 'active').length,
      totalNetworkInvestment: referrals.reduce((sum, r) => sum + (r.totalInvested || 0), 0),
      totalNetworkEarnings: referrals.reduce((sum, r) => sum + (r.balance || 0), 0),
      commissionsPotential: referrals.reduce((sum, r) => sum + ((r.balance || 0) * 0.10), 0)
    };

    return NextResponse.json({
      success: true,
      referrals: referrals.map(r => ({
        _id: r._id,
        firstName: r.name.split(' ')[0] || r.name,
        lastName: r.name.split(' ').slice(1).join(' ') || '',
        name: r.name,
        email: r.email,
        level: r.level || 1,
        totalInvested: r.totalInvested || 0,
        totalEarnings: r.balance || 0,
        balance: r.balance || 0,
        status: r.status,
        createdAt: r.createdAt
      })),
      stats: networkStats
    });

  } catch (error) {
    console.error('Admin get user network error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}