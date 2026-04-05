// app/api/payments/status/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { verifyAuth } from '@/lib/auth';
import { verifyTransaction } from '@/lib/kkiapay';

function getPendingPaymentModel() {
  const schema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  });
  return mongoose.models.PendingPayment || mongoose.model('PendingPayment', schema);
}

export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ success: false, message: 'transactionId manquant' }, { status: 400 });
    }

    await connectDB();
    const PendingPayment = getPendingPaymentModel();

    // Vérifier d'abord dans notre DB
    const pending = await PendingPayment.findOne({ transactionId, userId: payload.userId });

    if (!pending) {
      return NextResponse.json({ success: false, message: 'Paiement non trouvé' }, { status: 404 });
    }

    // Si déjà finalisé dans notre DB
    if (pending.status === 'completed') {
      return NextResponse.json({ success: true, status: 'completed' });
    }
    if (pending.status === 'failed') {
      return NextResponse.json({ success: true, status: 'failed' });
    }

    // Sinon, vérifier chez KkiaPay
    try {
      const result = await verifyTransaction(transactionId);

      if (result.success && result.data) {
        const kkiaStatus = result.status; // 'SUCCESS', 'FAILED', 'PENDING'

        if (kkiaStatus === 'SUCCESS') {
          pending.status = 'completed';
          await pending.save();
          return NextResponse.json({ success: true, status: 'completed', data: result.data });
        } else if (kkiaStatus === 'FAILED') {
          pending.status = 'failed';
          await pending.save();
          return NextResponse.json({ success: true, status: 'failed' });
        } else {
          // PENDING
          return NextResponse.json({ success: true, status: 'pending' });
        }
      }

      if (!result.success) {
        console.error('KkiaPay verify error:', result.error);
        return NextResponse.json({ success: true, status: 'pending' });
      }
    } catch (kkiaError) {
      console.error('KkiaPay check error:', kkiaError);
    }

    return NextResponse.json({ success: true, status: 'pending' });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}