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

// Importer la logique commune depuis le webhook
// On ne peut pas importer directement depuis route.js, donc on duplique le getPendingPaymentModel
function getPendingPaymentModel() {
  const schema = new mongoose.Schema({
    transactionId: { type: String, unique: true, sparse: true },
    depositId: { type: String, unique: true, sparse: true },
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

    // ==================== CRÉER/METTRE À JOUR LE PENDING PAYMENT ====================
    const PendingPayment = getPendingPaymentModel();
    
    // Chercher un pending existant ou en créer un
    let pending = await PendingPayment.findOne({
      $or: [{ transactionId }, { depositId: transactionId }]
    });

    if (pending && pending.status === 'completed') {
      // Déjà traité par le webhook
      const inv = await Investment.findOne({ 'paymentDetails.transactionId': transactionId });
      return NextResponse.json({ 
        success: true, 
        message: 'Investissement déjà créé', 
        investmentId: inv?._id 
      });
    }

    // Si pas de pending (le webhook n'a pas encore créé le pending),
    // on crée l'investissement directement
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity || opportunity.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Opportunité non disponible' }, { status: 404 });
    }

    // Importer dynamiquement la fonction commune
    const { createInvestmentFromPayment } = await import('@/app/api/payments/webhook/route');
    
    const result = await createInvestmentFromPayment({
      transactionId,
      userId: payload.userId,
      opportunityId,
      amount: verification.amount, // Montant réellement payé
      provider: 'kkiapay'
    });

    if (!result.success && !result.alreadyExists) {
      return NextResponse.json({ success: false, message: result.error || 'Erreur création investissement' }, { status: 500 });
    }

    // Mettre à jour ou créer le pending
    if (pending) {
      pending.status = 'completed';
      pending.transactionId = transactionId;
      await pending.save();
    } else {
      await PendingPayment.create({
        transactionId,
        userId: payload.userId,
        opportunityId,
        amount: verification.amount,
        status: 'completed',
        provider: 'kkiapay'
      });
    }

    return NextResponse.json({
      success: true,
      message: result.alreadyExists ? 'Investissement déjà créé' : 'Investissement créé avec succès',
      investmentId: result.investmentId,
      amount: result.amount,
      rate: result.rate
    });

  } catch (error) {
    console.error('❌ Payment verify error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}