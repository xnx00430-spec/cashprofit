// app/api/admin/crypto/wallets/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import CryptoWallet from '@/models/CryptoWallet';
import { verifyAuth } from '@/lib/auth';

// GET - Lister tous les wallets (admin)
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

    const wallets = await CryptoWallet.find()
      .sort({ isActive: -1, network: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, wallets });
  } catch (error) {
    console.error('Get wallets error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Ajouter un wallet
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

    const { network, address, label, notes } = await request.json();

    if (!network || !address || !label) {
      return NextResponse.json({ success: false, message: 'Réseau, adresse et label requis' }, { status: 400 });
    }

    const wallet = await CryptoWallet.create({
      network,
      address: address.trim(),
      label,
      notes: notes || '',
      addedBy: admin._id,
      isActive: true
    });

    return NextResponse.json({ success: true, wallet, message: 'Wallet ajouté avec succès' });
  } catch (error) {
    console.error('Create wallet error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Modifier un wallet (activer/désactiver, modifier adresse, etc.)
export async function PUT(request) {
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

    const { walletId, network, address, label, notes, isActive } = await request.json();

    if (!walletId) {
      return NextResponse.json({ success: false, message: 'ID wallet requis' }, { status: 400 });
    }

    const wallet = await CryptoWallet.findById(walletId);
    if (!wallet) {
      return NextResponse.json({ success: false, message: 'Wallet non trouvé' }, { status: 404 });
    }

    if (network !== undefined) wallet.network = network;
    if (address !== undefined) wallet.address = address.trim();
    if (label !== undefined) wallet.label = label;
    if (notes !== undefined) wallet.notes = notes;
    if (isActive !== undefined) wallet.isActive = isActive;

    await wallet.save();

    return NextResponse.json({ success: true, wallet, message: 'Wallet mis à jour' });
  } catch (error) {
    console.error('Update wallet error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un wallet
export async function DELETE(request) {
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
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json({ success: false, message: 'ID wallet requis' }, { status: 400 });
    }

    await CryptoWallet.findByIdAndDelete(walletId);

    return NextResponse.json({ success: true, message: 'Wallet supprimé' });
  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}