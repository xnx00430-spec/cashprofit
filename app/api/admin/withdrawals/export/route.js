// app/api/admin/withdrawals/export/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';

// GET - Exporter les retraits en CSV
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const date = searchParams.get('date'); // Format: YYYY-MM-DD

    await connectDB();

    // Construire le filtre
    const filter = { status };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Générer CSV
    const csvHeader = 'ID,Nom,Email,Téléphone,Montant,Type,Méthode,Compte,Nom Compte,Date Demande,Statut\n';
    
    const csvRows = withdrawals.map(w => {
      return [
        w._id,
        w.userId?.name || 'N/A',
        w.userId?.email || 'N/A',
        w.userId?.phone || 'N/A',
        w.amount,
        w.type,
        w.paymentMethod,
        w.accountNumber,
        w.accountName,
        new Date(w.createdAt).toLocaleDateString('fr-FR'),
        w.status
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Retourner le CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="retraits-${status}-${date || 'all'}.csv"`
      }
    });

  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}