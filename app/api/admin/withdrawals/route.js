import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';

// GET - Liste tous les retraits (ADMIN ONLY)
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
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    await connectDB();

    // Construire le filtre
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (userId) filter.userId = userId;

    // Récupérer les retraits
    const withdrawals = await Withdrawal.find(filter)
      .populate('userId', 'name email phone avatar')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Withdrawal.countDocuments(filter);

    // Stats globales
    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Montant total en attente
    const pendingAmount = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w._id,
        user: w.userId,
        amount: w.amount,
        type: w.type,
        status: w.status,
        paymentMethod: w.paymentMethod,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        transactionId: w.transactionId,
        processedBy: w.processedBy,
        rejectionReason: w.rejectionReason,
        requestedAt: w.createdAt,
        processedAt: w.processedAt,
        completedAt: w.completedAt,
        waitingDays: Math.floor((new Date() - new Date(w.createdAt)) / (24 * 60 * 60 * 1000))
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        pending: {
          count: stats.find(s => s._id === 'pending')?.count || 0,
          amount: stats.find(s => s._id === 'pending')?.totalAmount || 0
        },
        approved: {
          count: stats.find(s => s._id === 'approved')?.count || 0,
          amount: stats.find(s => s._id === 'approved')?.totalAmount || 0
        },
        completed: {
          count: stats.find(s => s._id === 'completed')?.count || 0,
          amount: stats.find(s => s._id === 'completed')?.totalAmount || 0
        },
        rejected: {
          count: stats.find(s => s._id === 'rejected')?.count || 0,
          amount: stats.find(s => s._id === 'rejected')?.totalAmount || 0
        },
        totalPendingAmount: pendingAmount[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Admin get withdrawals error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}