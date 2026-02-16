// app/api/admin/kyc/[userId]/reject/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

export async function POST(request, { params }) {
  try {
    const payload = await verifyAuth();
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { userId } = params;
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'La raison du rejet est requise' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Rejeter le KYC
    user.kyc.status = 'rejected';
    
    if (user.kyc.currentSubmission) {
      user.kyc.currentSubmission.reviewedAt = new Date();
      user.kyc.currentSubmission.reviewedBy = payload.userId;
      user.kyc.currentSubmission.adminMessage = reason;
    }
    
    await user.save();

    // 🔔 NOTIFICATION: KYC rejeté
    await createNotification(
      userId,
      NotificationTemplates.kycRejected(reason)
    );

    return NextResponse.json({
      success: true,
      message: 'KYC rejeté'
    });

  } catch (error) {
    console.error('Reject KYC error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}