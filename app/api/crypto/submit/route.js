// app/api/crypto/submit/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import CryptoWallet from '@/models/CryptoWallet';
import CryptoPayment from '@/models/CryptoPayment';
import { verifyAuth } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const formData = await request.formData();
    const walletId = formData.get('walletId');
    const amountFCFA = parseFloat(formData.get('amountFCFA'));
    const amountUSDT = parseFloat(formData.get('amountUSDT') || '0');
    const opportunityId = formData.get('opportunityId') || null;
    const opportunityName = formData.get('opportunityName') || '';
    const txHash = formData.get('txHash') || '';
    const proofFile = formData.get('proof');

    // Validations
    if (!walletId || !amountFCFA || !proofFile) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wallet, montant et capture d\'écran requis' 
      }, { status: 400 });
    }

    if (amountFCFA < 1000) {
      return NextResponse.json({ 
        success: false, 
        message: 'Montant minimum : 1,000 FCFA' 
      }, { status: 400 });
    }

    // Vérifier le wallet
    const wallet = await CryptoWallet.findById(walletId);
    if (!wallet || !wallet.isActive) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wallet non disponible' 
      }, { status: 400 });
    }

    // Upload la capture sur Cloudinary
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'crypto-proofs',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    // Créer le paiement crypto
    const cryptoPayment = await CryptoPayment.create({
      userId: user._id,
      walletId: wallet._id,
      walletSnapshot: {
        network: wallet.network,
        address: wallet.address,
        label: wallet.label
      },
      amountFCFA,
      amountUSDT,
      opportunityId: opportunityId || null,
      opportunityName,
      proofImage: uploadResult.secure_url,
      txHash,
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      message: 'Paiement soumis avec succès. Vous serez notifié une fois validé par l\'administrateur.',
      paymentId: cryptoPayment._id
    });

  } catch (error) {
    console.error('Submit crypto payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Historique des paiements crypto de l'utilisateur
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const payments = await CryptoPayment.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Get user crypto payments error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}