// app/api/payments/status/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { verifyAuth } from '@/lib/auth';
import { checkDepositStatus } from '@/lib/pawapay';

function getPendingPaymentModel() {
  const schema = new mongoose.Schema({
    depositId: { type: String, required: true, unique: true },
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
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ success: false, message: 'depositId manquant' }, { status: 400 });
    }

    await connectDB();
    const PendingPayment = getPendingPaymentModel();

    // Vérifier d'abord dans notre DB
    const pending = await PendingPayment.findOne({ depositId, userId: payload.userId });

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

    // Sinon, vérifier chez PawaPay
    try {
      const result = await checkDepositStatus(depositId);

      if (result.status === 'FOUND' && result.data) {
        const pawaStatus = result.data.status;

        if (pawaStatus === 'COMPLETED') {
          return NextResponse.json({ success: true, status: 'completed' });
        } else if (pawaStatus === 'FAILED') {
          pending.status = 'failed';
          await pending.save();
          return NextResponse.json({ success: true, status: 'failed' });
        } else {
          // SUBMITTED, ACCEPTED, IN_RECONCILIATION
          return NextResponse.json({ success: true, status: 'pending' });
        }
      }

      if (result.status === 'NOT_FOUND') {
        // Le user n'a peut-être pas encore appuyé sur "Pay"
        return NextResponse.json({ success: true, status: 'pending' });
      }
    } catch (pawaError) {
      console.error('PawaPay check error:', pawaError);
    }

    return NextResponse.json({ success: true, status: 'pending' });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}