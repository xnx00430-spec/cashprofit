// app/api/payments/verify/route.js
// Appelé par le frontend après que le widget KkiaPay retourne un transactionId
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import User from '@/models/User';
import Opportunity from '@/models/Opportunity';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';
import { verifyTransaction } from '@/lib/kkiapay';

function getPendingPaymentModel() {
  const schema = new mongoose.Schema({
    transactionId: { type: String, unique: true, sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    provider: { type: String, default: 'kkiapay' },
    createdAt: { type: Date, default: Date.now }
  });
  return mongoose.models.PendingPayment || mongoose.model('PendingPayment', schema);
}

export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { transactionId, opportunityId, amount } = await request.json();

    if (!transactionId || !opportunityId || !amount) {
      return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
    }

    await connectDB();

    // ==================== ANTI-DOUBLON ====================
    const existingInvestment = await Investment.findOne({
      'paymentDetails.transactionId': transactionId
    });
    if (existingInvestment) {
      return NextResponse.json({ 
        success: true, 
        message: 'Investissement déjà créé', 
        investmentId: existingInvestment._id 
      });
    }

    // ==================== VÉRIFIER CHEZ KKIAPAY ====================
    const verification = await verifyTransaction(transactionId);
    
    if (!verification.success || verification.status !== 'SUCCESS') {
      console.error('❌ Transaction not successful:', verification);
      return NextResponse.json({
        success: false,
        message: 'Le paiement n\'a pas abouti',
        status: verification.status
      }, { status: 400 });
    }

    // Vérifier le montant (anti-fraude)
    if (verification.amount < amount) {
      console.error(`❌ Amount mismatch: paid=${verification.amount}, expected=${amount}`);
      return NextResponse.json({ success: false, message: 'Le montant payé ne correspond pas' }, { status: 400 });
    }

    // ==================== RÉCUPÉRER L'UTILISATEUR ET L'OPPORTUNITÉ ====================
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity || opportunity.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Opportunité non disponible' }, { status: 404 });
    }

    // ==================== CRÉER L'INVESTISSEMENT ====================
    const investment = new Investment({
      userId: payload.userId,
      opportunityId,
      amount: verification.amount,
      initialRate: opportunity.baseRate || opportunity.finalRate,
      finalRate: opportunity.finalRate,
      bonus: opportunity.bonus || 0,
      earnPerWeek: (verification.amount * (opportunity.finalRate / 100)),
      earnPerDay: (verification.amount * (opportunity.finalRate / 100)) / 7,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      status: 'active',
      paymentDetails: {
        provider: 'kkiapay',
        transactionId,
        method: verification.source || 'mobile_money',
        status: 'completed',
        completedAt: new Date(verification.performedAt || Date.now())
      },
      currentEarnings: 0,
      totalEarnings: 0,
    });

    await investment.save();

    // ==================== METTRE À JOUR L'UTILISATEUR ====================
    user.totalInvested = (user.totalInvested || 0) + verification.amount;
    user.activeInvestments = (user.activeInvestments || 0) + 1;
    await user.save();

    // ==================== SAUVEGARDER LE PENDING PAYMENT ====================
    const PendingPayment = getPendingPaymentModel();
    
    await PendingPayment.create({
      transactionId,
      userId: payload.userId,
      opportunityId,
      amount: verification.amount,
      status: 'completed',
      provider: 'kkiapay'
    });

    console.log(`✅ Investment created from KkiaPay: ${transactionId} - ${user.name} - ${verification.amount} FCFA`);

    return NextResponse.json({
      success: true,
      message: 'Investissement créé avec succès',
      investmentId: investment._id,
      amount: verification.amount,
      rate: opportunity.finalRate
    });

  } catch (error) {
    console.error('❌ Payment verify error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}