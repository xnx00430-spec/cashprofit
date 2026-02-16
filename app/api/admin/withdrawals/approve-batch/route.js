// app/api/admin/withdrawals/approve-batch/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';

// POST - Approuver plusieurs retraits en masse
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { date, status } = await request.json();

    // Validation
    if (!date) {
      return NextResponse.json(
        { success: false, message: 'Date requise' },
        { status: 400 }
      );
    }

    await connectDB();

    // Construire le filtre pour les retraits du jour
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const filter = {
      status: status || 'pending',
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    };

    // Récupérer tous les retraits correspondants
    const withdrawals = await Withdrawal.find(filter);

    if (withdrawals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun retrait à approuver pour cette date',
        approved: 0
      });
    }

    // Approuver en masse
    let approvedCount = 0;
    for (const withdrawal of withdrawals) {
      await withdrawal.approve(payload.userId);
      approvedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${approvedCount} retrait(s) approuvé(s) avec succès`,
      approved: approvedCount,
      date
    });

  } catch (error) {
    console.error('Approve batch error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'approbation' },
      { status: 500 }
    );
  }
}