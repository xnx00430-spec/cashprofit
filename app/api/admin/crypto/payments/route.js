// app/api/admin/crypto/payments/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import CryptoPayment from '@/models/CryptoPayment';
import Investment from '@/models/Investment';
import Opportunity from '@/models/Opportunity';
import { verifyAuth } from '@/lib/auth';
import { createInvestmentFromPayment } from '@/app/api/payments/webhook/route';

// GET - Lister les paiements crypto (admin)
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const admin = await User.findById(payload.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const [payments, total] = await Promise.all([
      CryptoPayment.find(query)
        .populate('userId', 'name email phone level totalInvested')
        .populate('walletId', 'network address label')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CryptoPayment.countDocuments(query)
    ]);

    // Compter par statut
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      CryptoPayment.countDocuments({ status: 'pending' }),
      CryptoPayment.countDocuments({ status: 'approved' }),
      CryptoPayment.countDocuments({ status: 'rejected' })
    ]);

    return NextResponse.json({
      success: true,
      payments,
      total,
      pages: Math.ceil(total / limit),
      counts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount }
    });
  } catch (error) {
    console.error('Get crypto payments error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Valider ou rejeter un paiement
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const admin = await User.findById(payload.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 });
    }

    const { paymentId, action, adminMessage } = await request.json();

    if (!paymentId || !action) {
      return NextResponse.json({ success: false, message: 'ID paiement et action requis' }, { status: 400 });
    }

    const payment = await CryptoPayment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Paiement non trouvé' }, { status: 404 });
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Ce paiement a déjà été traité' }, { status: 400 });
    }

    // ==================== REJETER ====================
    if (action === 'reject') {
      payment.status = 'rejected';
      payment.reviewedBy = admin._id;
      payment.reviewedAt = new Date();
      payment.adminMessage = adminMessage || 'Paiement rejeté';
      await payment.save();

      return NextResponse.json({ success: true, message: 'Paiement rejeté' });
    }

    // ==================== APPROUVER ====================
    if (action === 'approve') {
      // Trouver l'opportunité pour le transactionId
      let opportunityId = payment.opportunityId;
      if (!opportunityId) {
        const opp = await Opportunity.findOne({ status: 'active' });
        opportunityId = opp?._id;
      }

      if (!opportunityId) {
        return NextResponse.json({ success: false, message: 'Aucune opportunité active trouvée' }, { status: 400 });
      }

      // Utiliser la logique commune (cagnotte + parrain + level up + notifications)
      const transactionId = `crypto_${payment._id}`;
      
      const result = await createInvestmentFromPayment({
        transactionId,
        userId: payment.userId,
        opportunityId,
        amount: payment.amountFCFA,
        provider: `crypto_${payment.walletSnapshot?.network || 'USDT'}`
      });

      if (!result.success && !result.alreadyExists) {
        return NextResponse.json({ 
          success: false, 
          message: result.error || 'Erreur lors de la création de l\'investissement' 
        }, { status: 500 });
      }

      // Mettre à jour le paiement crypto
      payment.status = 'approved';
      payment.reviewedBy = admin._id;
      payment.reviewedAt = new Date();
      payment.adminMessage = adminMessage || 'Paiement validé';
      payment.investmentId = result.investmentId;
      await payment.save();

      const user = await User.findById(payment.userId).select('name').lean();

      return NextResponse.json({
        success: true,
        message: `Paiement de ${payment.amountFCFA.toLocaleString()} F validé. Investissement créé pour ${user?.name || 'utilisateur'}.`,
        investmentId: result.investmentId
      });
    }

    return NextResponse.json({ success: false, message: 'Action invalide (approve/reject)' }, { status: 400 });
  } catch (error) {
    console.error('Process crypto payment error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur', error: error.message }, { status: 500 });
  }
}