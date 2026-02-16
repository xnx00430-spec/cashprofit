// app/api/admin/withdrawals/bulk-actions/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

// POST - Approuver ou Rejeter plusieurs retraits (par IDs)
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { ids, action, reason } = await request.json();

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Liste d\'IDs requise' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action invalide (approve ou reject)' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { success: false, message: 'Raison de rejet requise' },
        { status: 400 }
      );
    }

    await connectDB();

    // Récupérer les retraits
    const withdrawals = await Withdrawal.find({
      _id: { $in: ids },
      status: 'pending'
    });

    if (withdrawals.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucun retrait en attente trouvé'
      }, { status: 404 });
    }

    let successCount = 0;
    const errors = [];

    // Traiter chaque retrait
    for (const withdrawal of withdrawals) {
      try {
        if (action === 'approve') {
          await withdrawal.approve(payload.userId);
          
          // Notification
          await createNotification(
            withdrawal.userId,
            NotificationTemplates.withdrawalApproved(withdrawal.amount)
          );
        } else {
          await withdrawal.reject(payload.userId, reason);
          
          // Notification
          await createNotification(
            withdrawal.userId,
            NotificationTemplates.withdrawalRejected(withdrawal.amount, reason)
          );
        }
        
        successCount++;
      } catch (error) {
        console.error(`Erreur pour retrait ${withdrawal._id}:`, error);
        errors.push({
          id: withdrawal._id,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? `${successCount} retrait(s) approuvé(s)`
        : `${successCount} retrait(s) rejeté(s)`,
      processed: successCount,
      total: ids.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk actions error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}