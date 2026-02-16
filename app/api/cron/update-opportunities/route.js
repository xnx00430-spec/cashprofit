// app/api/cron/update-opportunities/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Opportunity from '@/models/Opportunity';

// Cette route sera appelée toutes les 10-30 minutes pour simuler l'activité
export async function GET(request) {
  try {
    // Vérifier token secret (sécurité)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Récupérer toutes les opportunités actives
    const opportunities = await Opportunity.find({ isActive: true });

    const updates = [];

    for (const opp of opportunities) {
      // Probabilité d'update basée sur popularité
      const updateChance = opp.featured ? 0.8 : 0.5;
      
      if (Math.random() > updateChance) continue;

      // Nombre aléatoire d'investisseurs (0-3)
      const newInvestors = Math.floor(Math.random() * 4);
      
      // Montant aléatoire investi (10K - 500K)
      const minAmount = 10000;
      const maxAmount = 500000;
      const newAmount = Math.floor(Math.random() * (maxAmount - minAmount) + minAmount);

      // Mise à jour
      opp.totalInvestors += newInvestors;
      opp.totalInvested += newAmount;
      await opp.save();

      updates.push({
        opportunity: opp.title,
        addedInvestors: newInvestors,
        addedAmount: newAmount
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} opportunities`,
      updates
    });

  } catch (error) {
    console.error('Cron update error:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating opportunities' },
      { status: 500 }
    );
  }
}