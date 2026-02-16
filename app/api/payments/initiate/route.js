// app/api/payments/initiate/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Opportunity from '@/models/Opportunity';
import { verifyAuth } from '@/lib/auth';
import { createPaymentPage, generateDepositId } from '@/lib/pawapay';

// Modèle simple pour tracker les paiements en attente
import mongoose from 'mongoose';

const PendingPaymentSchema = new mongoose.Schema({
  depositId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL 1h
});

const PendingPayment = mongoose.models.PendingPayment || mongoose.model('PendingPayment', PendingPaymentSchema);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cashprofit.fr';

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

    // Générer depositId unique
    const depositId = generateDepositId();

    // Sauvegarder le paiement en attente AVANT d'appeler PawaPay
    await PendingPayment.create({
      depositId,
      userId: user._id,
      opportunityId: opportunity._id,
      amount,
    });

    // Créer la Payment Page PawaPay
    const result = await createPaymentPage({
      depositId,
      amount,
      country: 'CIV', // Côte d'Ivoire
      returnUrl: `${BASE_URL}/user/payment/return?depositId=${depositId}`,
      reason: `Investissement ${opportunity.name} - ${amount.toLocaleString()} FCFA`,
    });

    if (!result.success) {
      // Supprimer le pending payment si PawaPay échoue
      await PendingPayment.deleteOne({ depositId });
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la création du paiement' },
        { status: 500 }
      );
    }

    console.log(`💳 Payment initiated: ${depositId} - ${user.name} - ${amount} FCFA`);

    return NextResponse.json({
      success: true,
      paymentUrl: result.redirectUrl,
      depositId,
    });

  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}