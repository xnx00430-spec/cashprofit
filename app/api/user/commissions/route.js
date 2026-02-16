import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Commission from '@/models/Commission';
import { verifyAuth } from '@/lib/auth';

// GET - Historique et stats des commissions
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    await connectDB();

    // Récupérer l'historique des commissions
    const commissions = await Commission.find({ userId: payload.userId })
      .populate('fromUserId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCommissions = await Commission.countDocuments({ userId: payload.userId });

    // Calculer les stats
    const stats = await Commission.aggregate([
      { $match: { userId: payload.userId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          byLevel: {
            $push: {
              level: '$level',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Stats par niveau de profondeur
    const levelBreakdown = await Commission.aggregate([
      { $match: { userId: payload.userId } },
      {
        $group: {
          _id: '$level',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Stats mensuelles (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Commission.aggregate([
      {
        $match: {
          userId: payload.userId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return NextResponse.json({
      success: true,
      commissions: commissions.map(c => ({
        id: c._id,
        amount: c.amount,
        percentage: c.percentage,
        level: c.level,
        fromUser: c.fromUserId,
        type: c.type,
        description: c.description,
        date: c.createdAt
      })),
      pagination: {
        page,
        limit,
        total: totalCommissions,
        pages: Math.ceil(totalCommissions / limit)
      },
      stats: {
        totalEarned: stats[0]?.totalAmount || 0,
        totalTransactions: stats[0]?.totalCount || 0,
        levelBreakdown: levelBreakdown.map(l => ({
          level: l._id,
          total: l.total,
          count: l.count,
          percentage: getCommissionRate(l._id)
        })),
        monthlyStats: monthlyStats.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          total: m.total,
          count: m.count
        }))
      }
    });

  } catch (error) {
    console.error('Get commissions error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Taux de commission par niveau
function getCommissionRate(level) {
  const rates = {
    1: 10,
    2: 5,
    3: 2.5,
    4: 2,
    5: 1.5,
    6: 1,
    7: 0.75,
    8: 0.5,
    9: 0.25,
    10: 0.1
  };
  return rates[level] || 0;
}