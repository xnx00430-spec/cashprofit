import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Withdrawal from '@/models/Withdrawal';
import Commission from '@/models/Commission';
import { verifyAuth } from '@/lib/auth';

// GET - Stats globales pour le dashboard admin
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    await connectDB();

    // Stats utilisateurs
const totalUsers = await User.countDocuments({ role: 'user' });
const activeUsers = await User.countDocuments({ 
  status: 'active',
  role: 'user'
});    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Stats investissements
    const totalInvestments = await Investment.countDocuments();
    const activeInvestments = await Investment.countDocuments({ status: 'active' });
    const totalInvestedAmount = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Stats retraits
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const totalWithdrawals = await Withdrawal.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Stats KYC
    const pendingKYC = await User.countDocuments({ 'kyc.status': 'pending' });
    const approvedKYC = await User.countDocuments({ 'kyc.status': 'approved' });

    // Revenus par niveau
    const revenueByLevel = await Investment.aggregate([
      {
        $group: {
          _id: '$level',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Croissance mensuelle (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalInvested: { $sum: '$totalInvested' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top investisseurs
    const topInvestors = await User.find()
      .select('name email totalInvested totalEarnings avatar')
      .sort({ totalInvested: -1 })
      .limit(10)
      .lean();

    // Stats commissions
    const totalCommissions = await Commission.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Activité récente
    const recentActivity = await User.find()
      .select('name lastLogin')
      .sort({ lastLogin: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          blocked: blockedUsers,
          newToday: newUsersToday,
          growthRate: totalUsers > 0 ? ((newUsersToday / totalUsers) * 100).toFixed(2) : 0
        },
        investments: {
          total: totalInvestments,
          active: activeInvestments,
          totalAmount: totalInvestedAmount[0]?.total || 0,
          averageAmount: totalInvestments > 0 
            ? Math.round((totalInvestedAmount[0]?.total || 0) / totalInvestments)
            : 0
        },
        withdrawals: {
          pending: pendingWithdrawals,
          totalPaid: totalWithdrawals[0]?.total || 0
        },
        kyc: {
          pending: pendingKYC,
          approved: approvedKYC,
          approvalRate: (pendingKYC + approvedKYC) > 0
            ? ((approvedKYC / (pendingKYC + approvedKYC)) * 100).toFixed(2)
            : 0
        },
        revenue: {
          total: totalInvestedAmount[0]?.total || 0,
          byLevel: revenueByLevel.map(r => ({
            level: r._id,
            amount: r.total,
            count: r.count
          })),
          commissions: totalCommissions[0]?.total || 0
        },
        growth: {
          monthly: monthlyGrowth.map(m => ({
            month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
            users: m.count,
            invested: m.totalInvested
          }))
        },
        topInvestors: topInvestors.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          totalInvested: u.totalInvested,
          totalEarnings: u.totalEarnings
        })),
        recentActivity: recentActivity.map(u => ({
          name: u.name,
          lastLogin: u.lastLogin
        }))
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}