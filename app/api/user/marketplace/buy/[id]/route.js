// app/api/user/marketplace/buy/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import P2PListing from '@/models/P2PListing';
import { verifyAuth } from '@/lib/auth';

// POST - Acheter un investissement P2P
export async function POST(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const listing = await P2PListing.findById(params.id)
      .populate('investmentId');

    if (!listing || listing.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Offre non disponible' },
        { status: 404 }
      );
    }

    // Ne pas acheter sa propre offre
    if (listing.sellerId.toString() === payload.userId) {
      return NextResponse.json(
        { success: false, message: 'Vous ne pouvez pas acheter votre propre offre' },
        { status: 400 }
      );
    }

    const buyer = await User.findById(payload.userId);
    const seller = await User.findById(listing.sellerId);

    if (!buyer || !seller) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'acheteur a assez de fonds (balance)
    if (buyer.balance < listing.sellingPrice) {
      return NextResponse.json(
        { success: false, message: 'Solde insuffisant' },
        { status: 400 }
      );
    }

    // TRANSACTION AUTOMATIQUE
    
    // 1. Débiter l'acheteur
    buyer.balance -= listing.sellingPrice;
    
    // 2. Créditer le vendeur (60%)
    seller.balance += listing.sellerReceives;
    
    // 3. Platform prend 40% (ajouter au compte admin ou tracker)
    // TODO: Ajouter à un compte "platformRevenue" si besoin
    
    // 4. Transférer l'investissement à l'acheteur
    const investment = listing.investmentId;
    investment.userId = buyer._id;
    investment.status = 'active';
    
    // 5. Marquer l'annonce comme vendue
    await listing.markAsSold(buyer._id);
    
    // Sauvegarder tout
    await buyer.save();
    await seller.save();
    await investment.save();

    return NextResponse.json({
      success: true,
      message: 'Investissement acheté avec succès',
      transaction: {
        amount: listing.sellingPrice,
        sellerReceived: listing.sellerReceives,
        platformFee: listing.platformFee,
        investment: {
          id: investment._id,
          opportunityTitle: listing.opportunityTitle,
          amount: investment.amount
        }
      }
    });

  } catch (error) {
    console.error('Buy P2P error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'achat' },
      { status: 500 }
    );
  }
}