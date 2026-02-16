// app/api/user/marketplace/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import P2PListing from '@/models/P2PListing';
import { verifyAuth } from '@/lib/auth';

// GET - Liste des offres P2P disponibles
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'available' ou 'my-listings'

    await connectDB();

    let listings;

    if (type === 'my-listings') {
      // Mes annonces
      listings = await P2PListing.find({
        sellerId: payload.userId,
        status: { $in: ['active', 'sold'] }
      })
        .populate('buyerId', 'name')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Offres disponibles (pas les miennes)
      listings = await P2PListing.find({
        status: 'active',
        sellerId: { $ne: payload.userId }
      })
        .populate('sellerId', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();
    }

    const formattedListings = listings.map(listing => ({
      id: listing._id,
      seller: listing.sellerId ? {
        id: listing.sellerId._id,
        name: listing.sellerId.name,
        avatar: listing.sellerId.avatar
      } : null,
      opportunityTitle: listing.opportunityTitle,
      originalAmount: listing.originalAmount,
      currentGains: listing.currentGains,
      sellingPrice: listing.sellingPrice,
      level: listing.level,
      weeklyRate: listing.weeklyRate,
      status: listing.status,
      buyer: listing.buyerId ? { name: listing.buyerId.name } : null,
      createdAt: listing.createdAt,
      soldAt: listing.soldAt
    }));

    return NextResponse.json({
      success: true,
      listings: formattedListings,
      total: formattedListings.length
    });

  } catch (error) {
    console.error('Get marketplace error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}