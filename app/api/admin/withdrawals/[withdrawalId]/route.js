// app/api/admin/withdrawals/[withdrawalId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates, sendWithdrawalCompletedEmail } from '@/lib/notifications';

// PUT - Approuver ou Rejeter un retrait (ADMIN ONLY)
export async function PUT(request, context) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Next.js 15 : params doit être await
    const { withdrawalId } = await context.params;

    const { action, transactionId, reason, adminNotes } = await request.json();

    if (!action || !['approve', 'reject', 'complete'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action invalide' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { success: false, message: 'Raison de rejet requise' },
        { status: 400 }
      );
    }

    if (action === 'complete' && !transactionId) {
      return NextResponse.json(
        { success: false, message: 'ID de transaction requis' },
        { status: 400 }
      );
    }

    await connectDB();

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Retrait non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le retrait est en statut pending
    if (action !== 'complete' && withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Ce retrait ne peut plus être modifié' },
        { status: 400 }
      );
    }

    // Récupérer le user
    const user = await User.findById(withdrawal.userId).select('name email phone');

    // Appliquer l'action
    switch (action) {
      case 'approve':
        await withdrawal.approve(payload.userId);
        if (adminNotes) withdrawal.adminNotes = adminNotes;
        await withdrawal.save();
        
        // 🔔 Notification in-app
        try {
          await createNotification(
            withdrawal.userId,
            NotificationTemplates.withdrawalApproved(withdrawal.amount)
          );
        } catch (e) { console.error('Notif error:', e); }
        break;

      case 'reject':
        await withdrawal.reject(payload.userId, reason);
        if (adminNotes) withdrawal.adminNotes = adminNotes;
        await withdrawal.save();
        
        // 🔔 Notification in-app
        try {
          await createNotification(
            withdrawal.userId,
            NotificationTemplates.withdrawalRejected(withdrawal.amount, reason)
          );
        } catch (e) { console.error('Notif error:', e); }
        break;

      case 'complete':
        // Vérifier que le retrait est approuvé
        if (withdrawal.status !== 'approved') {
          return NextResponse.json(
            { success: false, message: 'Le retrait doit être approuvé avant d\'être complété' },
            { status: 400 }
          );
        }
        
        await withdrawal.complete(payload.userId, transactionId);
        if (adminNotes) {
          withdrawal.adminNotes = adminNotes;
          await withdrawal.save();
        }
        
        // 🔔 Notification in-app
        try {
          await createNotification(
            withdrawal.userId,
            NotificationTemplates.withdrawalCompleted(withdrawal.amount)
          );
        } catch (e) { console.error('Notif error:', e); }

        // ✉️ EMAIL: Retrait complété (argent envoyé)
        if (user?.email) {
          sendWithdrawalCompletedEmail(user.email, user.name, {
            amount: withdrawal.amount,
            method: withdrawal.paymentMethod
          }).catch(console.error);
        }
        break;
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? 'Retrait approuvé avec succès'
        : action === 'reject'
        ? 'Retrait rejeté'
        : 'Retrait complété avec succès',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        amount: withdrawal.amount,
        user: user?.name,
        processedAt: withdrawal.processedAt,
        completedAt: withdrawal.completedAt,
        transactionId: withdrawal.transactionId
      }
    });

  } catch (error) {
    console.error('Admin withdrawal action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}