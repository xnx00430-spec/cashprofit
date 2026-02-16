// app/api/user/marketplace/sell/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Investment from '@/models/Investment';
import P2PListing from '@/models/P2PListing';
import Opportunity from '@/models/Opportunity';
import { verifyAuth } from '@/lib/auth';

// POST - Mettre un investissement en vente P2P
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { investmentId, sellingPrice } = await request.json();

    // Validation
    if (!investmentId || !sellingPrice || sellingPrice < 1000) {
      return NextResponse.json(
        { success: false, message: 'Données invalides' },
        { status: 400 }
      );
    }

    await connectDB();

    // Vérifier que l'investissement appartient au user
    const investment = await Investment.findOne({
      _id: investmentId,
      userId: payload.userId,
      status: 'active'
    }).populate('opportunityId');

    if (!investment) {
      return NextResponse.json(
        { success: false, message: 'Investissement non trouvé ou déjà vendu' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'est pas déjà en vente
    const existingListing = await P2PListing.findOne({
      investmentId,
      status: 'active'
    });

    if (existingListing) {
      return NextResponse.json(
        { success: false, message: 'Cet investissement est déjà en vente' },
        { status: 400 }
      );
    }

    // Calculer le split 60/40
    const { sellerReceives, platformFee } = P2PListing.calculateSplit(sellingPrice);

    // Calculer gains actuels
    const now = new Date();
    const weeksPassed = Math.floor((now - investment.startDate) / (7 * 24 * 60 * 60 * 1000));
    const activeWeeks = Math.min(weeksPassed, investment.maxWeeks);
    const currentGains = investment.amount * (investment.weeklyRate / 100) * activeWeeks;

    // Créer l'annonce P2P
    const listing = await P2PListing.create({
      sellerId: payload.userId,
      investmentId,
      sellingPrice,
      originalAmount: investment.amount,
      currentGains,
      sellerReceives,
      platformFee,
      opportunityId: investment.opportunityId?._id,
      opportunityTitle: investment.opportunityId?.title || 'Opportunité',
      level: investment.level,
      weeklyRate: investment.weeklyRate,
      status: 'active'
    });

    // Marquer l'investissement comme en vente
    investment.status = 'pending_sale';
    await investment.save();

    return NextResponse.json({
      success: true,
      message: 'Investissement mis en vente avec succès',
      listing: {
        id: listing._id,
        sellingPrice: listing.sellingPrice,
        youReceive: listing.sellerReceives,
        platformFee: listing.platformFee,
        opportunityTitle: listing.opportunityTitle
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create P2P listing error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise en vente' },
      { status: 500 }
    );
  }
}