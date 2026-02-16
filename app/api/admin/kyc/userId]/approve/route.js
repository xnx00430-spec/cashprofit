// app/api/admin/kyc/[userId]/approve/route.js
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

    await connectDB();

    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Approuver le KYC
    if (user.kyc && user.kyc.currentSubmission) {
      user.kyc.currentSubmission.reviewedAt = new Date();
      user.kyc.currentSubmission.reviewedBy = payload.userId;
    }
    
    user.kyc.status = 'approved';
    await user.save();

    // 🔔 NOTIFICATION: KYC approuvé
    await createNotification(
      userId,
      NotificationTemplates.kycApproved()
    );

    return NextResponse.json({
      success: true,
      message: 'KYC approuvé avec succès'
    });

  } catch (error) {
    console.error('Approve KYC error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}