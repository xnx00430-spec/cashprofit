import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';

// GET - Détails d'un retrait
export async function GET(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const withdrawal = await Withdrawal.findOne({
      _id: params.id,
      userId: payload.userId
    }).lean();

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Retrait non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        type: withdrawal.type,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod,
        accountNumber: withdrawal.accountNumber,
        accountName: withdrawal.accountName,
        requestedAt: withdrawal.createdAt,
        processedAt: withdrawal.processedAt,
        completedAt: withdrawal.completedAt,
        rejectionReason: withdrawal.rejectionReason,
        transactionId: withdrawal.transactionId,
        canCancel: withdrawal.status === 'pending'
      }
    });

  } catch (error) {
    console.error('Get withdrawal details error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Annuler un retrait
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const withdrawal = await Withdrawal.findOne({
      _id: params.id,
      userId: payload.userId
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Retrait non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le retrait peut être annulé
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Impossible d\'annuler ce retrait' },
        { status: 400 }
      );
    }

    // Annuler le retrait
    withdrawal.status = 'cancelled';
    withdrawal.cancelledAt = new Date();
    await withdrawal.save();

    return NextResponse.json({
      success: true,
      message: 'Retrait annulé avec succès'
    });

  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}