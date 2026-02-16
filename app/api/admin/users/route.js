import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// GET - Liste tous les utilisateurs (ADMIN ONLY)
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const status = searchParams.get('status');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const kycStatus = searchParams.get('kyc');
    const skip = (page - 1) * limit;

    await connectDB();

    const filter = { role: { $ne: 'admin' } };

    if (status && status !== 'all') filter.status = status;
    if (level) filter.level = parseInt(level);
    if (kycStatus) filter['kyc.status'] = kycStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { sponsorCode: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    // ==================== CALCUL GAINS LIVE ====================
    // Charger TOUS les investissements actifs en une seule query
    const userIds = users.map(u => u._id);
    const allInvestments = await Investment.find({
      userId: { $in: userIds },
      status: 'active'
    }).lean();

    // Calculer les gains live par user
    const now = new Date();
    const liveEarningsByUser = {};

    for (const inv of allInvestments) {
      const uid = inv.userId.toString();
      if (!liveEarningsByUser[uid]) liveEarningsByUser[uid] = 0;

      const startDate = new Date(inv.startDate);
      const endDate = new Date(inv.endDate);
      const effectiveNow = now > endDate ? endDate : now;
      const msElapsed = effectiveNow - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
      const grossEarnings = weeklyEarning * weeksElapsed;
      const lastSynced = inv.lastSyncedEarnings || 0;
      const currentLiveEarnings = Math.max(grossEarnings - lastSynced, 0);

      liveEarningsByUser[uid] += currentLiveEarnings;
    }

    // ==================== FIN CALCUL GAINS LIVE ====================

    // Stats globales
    const stats = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } },
          totalInvested: { $sum: '$totalInvested' },
          totalEarnings: { $sum: '$balance' },
          totalCommissions: { $sum: '$totalCommissions' },
          totalBonus: { $sum: '$bonusParrainage' },
          totalWithdrawn: { $sum: '$totalWithdrawn' }
        }
      }
    ]);

    const kycStats = await User.aggregate([
      { $group: { _id: '$kyc.status', count: { $sum: 1 } } }
    ]);

    // Compter les referrals pour chaque user
    const usersWithData = await Promise.all(
      users.map(async (user) => {
        const referralCount = await User.countDocuments({ referredBy: user._id });
        const uid = user._id.toString();
        const hasReferrer = !!user.referredBy;
        const liveEarnings = liveEarningsByUser[uid] || 0;
        // Si le user a un parrain, ses gains nets = 90%
        const netLiveEarnings = hasReferrer ? liveEarnings * 0.90 : liveEarnings;

        return {
          ...user,
          referralCount,
          liveEarnings: Math.round(netLiveEarnings * 100) / 100,
          // Bénéfices totaux = balance (synced) + gains live non synced
          totalBenefits: Math.round(((user.balance || 0) + netLiveEarnings) * 100) / 100
        };
      })
    );

    // Calculer total des gains live pour les stats globales
    const totalLiveEarnings = Object.values(liveEarningsByUser).reduce((sum, v) => sum + v, 0);

    return NextResponse.json({
      success: true,
      users: usersWithData.map(u => ({
        _id: u._id,
        firstName: u.name.split(' ')[0] || u.name,
        lastName: u.name.split(' ').slice(1).join(' ') || '',
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        status: u.status,
        role: u.role,
        level: u.level,
        sponsorCode: u.sponsorCode,
        referredByCode: u.referredByCode,
        totalInvested: u.totalInvested,
        balance: u.balance,
        liveEarnings: u.liveEarnings,
        totalBenefits: u.totalBenefits,
        totalCommissions: u.totalCommissions,
        bonusParrainage: u.bonusParrainage,
        totalWithdrawn: u.totalWithdrawn,
        kycStatus: u.kyc?.status || 'null',
        referralCount: u.referralCount,
        currentLevelCagnotte: u.currentLevelCagnotte,
        currentLevelTarget: u.currentLevelTarget,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: stats[0]?.total || 0,
        active: stats[0]?.active || 0,
        pending: stats[0]?.pending || 0,
        blocked: stats[0]?.blocked || 0,
        totalInvested: stats[0]?.totalInvested || 0,
        totalEarnings: Math.round(((stats[0]?.totalEarnings || 0) + totalLiveEarnings) * 100) / 100,
        totalCommissions: stats[0]?.totalCommissions || 0,
        totalBonus: stats[0]?.totalBonus || 0,
        totalWithdrawn: stats[0]?.totalWithdrawn || 0,
        kyc: {
          null: kycStats.find(k => k._id === 'null')?.count || 0,
          pending: kycStats.find(k => k._id === 'pending')?.count || 0,
          approved: kycStats.find(k => k._id === 'approved')?.count || 0,
          rejected: kycStats.find(k => k._id === 'rejected')?.count || 0
        }
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Bloquer ou débloquer un utilisateur (ADMIN ONLY)
export async function PUT(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { action, reason } = await request.json();

    if (!action || !['block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action invalide (block ou unblock)' },
        { status: 400 }
      );
    }

    if (action === 'block' && !reason) {
      return NextResponse.json(
        { success: false, message: 'Raison de blocage requise' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(params.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Impossible de bloquer un administrateur' },
        { status: 400 }
      );
    }

    if (action === 'block') {
      user.status = 'blocked';
    } else {
      user.status = 'active';
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: action === 'block' 
        ? 'Utilisateur bloqué avec succès'
        : 'Utilisateur débloqué avec succès',
      user: {
        id: user._id,
        name: user.name,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Admin block user error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}