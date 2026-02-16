import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Withdrawal from '@/models/Withdrawal';
import Commission from '@/models/Commission';
import { verifyAuth } from '@/lib/auth';

// GET - Détails complets d'un utilisateur (ADMIN ONLY)
export async function GET(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(params.userId)
      .populate('referredBy', 'name email sponsorCode')
      .populate('referrals', 'name email totalInvested level')
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Investissements de l'utilisateur
    const investments = await Investment.find({ userId: params.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Retraits de l'utilisateur
    const withdrawals = await Withdrawal.find({ userId: params.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Commissions gagnées
    const commissions = await Commission.find({ userId: params.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Stats du réseau
    const networkStats = await User.aggregate([
      { $match: { referredBy: user._id } },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          totalNetworkInvestment: { $sum: '$totalInvested' }
        }
      }
    ]);

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
        role: user.role,
        level: user.level,
        sponsorCode: user.sponsorCode,
        referredBy: user.referredBy,
        referredByCode: user.referredByCode,
        balance: user.balance,
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
        totalWithdrawn: user.totalWithdrawn,
        totalCommissions: user.totalCommissions,
        kyc: user.kyc,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      investments: investments.map(i => ({
        id: i._id,
        amount: i.amount,
        level: i.level,
        status: i.status,
        weeklyRate: i.weeklyRate,
        createdAt: i.createdAt
      })),
      withdrawals: withdrawals.map(w => ({
        id: w._id,
        amount: w.amount,
        status: w.status,
        type: w.type,
        createdAt: w.createdAt
      })),
      commissions: commissions.map(c => ({
        id: c._id,
        amount: c.amount,
        level: c.level,
        createdAt: c.createdAt
      })),
      network: {
        directReferrals: user.referrals.length,
        totalNetwork: networkStats[0]?.totalReferrals || 0,
        networkInvestment: networkStats[0]?.totalNetworkInvestment || 0
      }
    });

  } catch (error) {
    console.error('Admin get user details error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un utilisateur (ADMIN ONLY)
export async function PUT(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const allowedUpdates = ['name', 'email', 'phone', 'address', 'level', 'status', 'role', 'balance'];

    await connectDB();

    const user = await User.findById(params.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Appliquer les modifications autorisées
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        user[key] = updates[key];
      }
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        status: user.status,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}