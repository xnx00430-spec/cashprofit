import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// GET - Liste tous les investissements (ADMIN ONLY)
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
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    await connectDB();

    // Construire le filtre
    const filter = {};
    if (status) filter.status = status;
    if (level) filter.level = parseInt(level);
    if (userId) filter.userId = userId;

    // Récupérer les investissements
    const investments = await Investment.find(filter)
      .populate('userId', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Investment.countDocuments(filter);

    // Calculer les gains pour chaque investissement
    const now = new Date();
    const investmentsWithGains = investments.map(inv => {
      const weeksPassed = Math.floor((now - new Date(inv.startDate)) / (7 * 24 * 60 * 60 * 1000));
      const activeWeeks = Math.min(weeksPassed, inv.maxWeeks);
      const weeklyGain = inv.amount * (inv.weeklyRate / 100);
      const totalGains = weeklyGain * activeWeeks;

      return {
        id: inv._id,
        user: inv.userId,
        amount: inv.amount,
        level: inv.level,
        type: inv.type,
        status: inv.status,
        weeklyRate: inv.weeklyRate,
        maxWeeks: inv.maxWeeks,
        weeksPassed: activeWeeks,
        totalGains,
        startDate: inv.startDate,
        endDate: inv.endDate,
        createdAt: inv.createdAt
      };
    });

    // Stats globales
    const stats = await Investment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      investments: investmentsWithGains,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        active: stats.find(s => s._id === 'active') || { count: 0, totalAmount: 0 },
        completed: stats.find(s => s._id === 'completed') || { count: 0, totalAmount: 0 },
        withdrawn: stats.find(s => s._id === 'withdrawn') || { count: 0, totalAmount: 0 }
      }
    });

  } catch (error) {
    console.error('Admin get investments error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}