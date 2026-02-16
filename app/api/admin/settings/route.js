import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { verifyAuth } from '@/lib/auth';

// GET - Récupérer les paramètres (ADMIN ONLY)
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    await connectDB();

    let settings = await Settings.findOne();
    
    // Si aucun paramètre n'existe, créer les paramètres par défaut
    if (!settings) {
      settings = await Settings.create({
        levels: {
          1: { rate: 10, duration: 4, requireReferrals: 5 },
          2: { rate: 15, duration: 2, requireReferrals: 15 },
          3: { rate: 20, duration: 2, requireReferrals: 30 },
          4: { rate: 25, duration: 2, requireReferrals: 50 },
          5: { rate: 30, duration: 0, requireReferrals: 0 }
        },
        commissions: {
          rates: [10, 5, 2.5, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.1],
          maxDepth: 10,
          enabled: true
        },
        investments: {
          minAmount: 10000,
          maxAmount: 10000000,
          allowMultiple: true
        },
        withdrawals: {
          minAmount: 1000,
          feePercentage: 0,
          processingTime: '24-48 heures',
          requireKYC: true
        },
        system: {
          maintenanceMode: false,
          registrationEnabled: true,
          investmentEnabled: true,
          withdrawalEnabled: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Admin get settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier les paramètres (ADMIN ONLY)
export async function PUT(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const updates = await request.json();

    await connectDB();

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    // Appliquer les modifications
    if (updates.levels) settings.levels = updates.levels;
    if (updates.commissions) settings.commissions = { ...settings.commissions, ...updates.commissions };
    if (updates.investments) settings.investments = { ...settings.investments, ...updates.investments };
    if (updates.withdrawals) settings.withdrawals = { ...settings.withdrawals, ...updates.withdrawals };
    if (updates.system) settings.system = { ...settings.system, ...updates.system };

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      settings
    });

  } catch (error) {
    console.error('Admin update settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}