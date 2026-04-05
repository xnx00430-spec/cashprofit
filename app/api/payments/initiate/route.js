// app/api/payments/initiate/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Opportunity from '@/models/Opportunity';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

const PendingPaymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL 1h
});

const PendingPayment = mongoose.models.PendingPayment || mongoose.model('PendingPayment', PendingPaymentSchema);

export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { opportunityId, amount } = await request.json();

    if (!opportunityId || !amount || amount < 1000) {
      return NextResponse.json(
        { success: false, message: 'Données invalides. Montant minimum: 1,000 FCFA' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity || opportunity.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Opportunité non disponible' },
        { status: 404 }
      );
    }

    // Vérifier limites
    const min = opportunity.minInvestment || 1000;
    const max = opportunity.maxInvestment || 10000000;
    if (amount < min || amount > max) {
      return NextResponse.json(
        { success: false, message: `Montant entre ${min.toLocaleString()} et ${max.toLocaleString()} FCFA` },
        { status: 400 }
      );
    }

    console.log(`💳 KkiaPay payment initiated: ${user.name} - ${amount} FCFA - ${opportunity.name}`);

    return NextResponse.json({
      success: true,
      message: 'Paiement prêt. Le widget KkiaPay va s\'ouvrir côté client.',
      opportunityId: opportunity._id,
      amount,
      opportunityName: opportunity.name,
    });

  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}