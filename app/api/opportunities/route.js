// app/api/opportunities/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Opportunity from '@/models/Opportunity';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();

    // Récupérer le niveau de l'user si authentifié
    let userLevel = 1;
    try {
      const payload = await verifyAuth();
      if (payload) {
        const user = await User.findById(payload.userId).select('level');
        if (user) {
          userLevel = user.level;
        }
      }
    } catch (error) {
      // User non authentifié, on utilise niveau 1
    }

    // Récupérer toutes les opportunités actives
    const opportunities = await Opportunity.find({ status: 'active' })
      .sort({ order: 1 })
      .lean();

    // Calculer le taux final pour chaque opportunité
    const opportunitiesWithRates = opportunities.map(opp => {
      const bonus = userLevel === 1 ? 0 : userLevel === 2 ? 5 : 10;
      const finalRate = opp.baseRate + bonus;
      
      return {
        id: opp._id,
        name: opp.name,
        slug: opp.slug,
        description: opp.description,
        category: opp.category,
        baseRate: opp.baseRate,
        bonus: bonus,
        finalRate: finalRate,
        duration: opp.duration,
        minInvestment: opp.minInvestment,
        maxInvestment: opp.maxInvestment,
        riskLevel: opp.riskLevel,
        guaranteeMessage: opp.guaranteeMessage,
        image: opp.image,
        totalInvested: opp.totalInvested,
        activeInvestors: opp.activeInvestors
      };
    });

    return NextResponse.json({
      success: true,
      opportunities: opportunitiesWithRates,
      userLevel: userLevel
    });

  } catch (error) {
    console.error('Get opportunities error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}