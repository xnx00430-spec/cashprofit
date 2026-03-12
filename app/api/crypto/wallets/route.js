// app/api/crypto/wallets/route.js
// Route PUBLIQUE (user connecté) - récupérer les wallets actifs
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CryptoWallet from '@/models/CryptoWallet';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    // Retourner uniquement les wallets actifs (sans les notes internes)
    const wallets = await CryptoWallet.find({ isActive: true })
      .select('network address label')
      .sort({ network: 1 })
      .lean();

    return NextResponse.json({ success: true, wallets });
  } catch (error) {
    console.error('Get active wallets error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}