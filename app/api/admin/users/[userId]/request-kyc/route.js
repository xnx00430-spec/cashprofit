// app/api/admin/users/[userId]/request-kyc/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

export async function POST(request, { params }) {
  try {
    const payload = await verifyAuth();
    
    // Vérifier que c'est un admin
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { userId } = params;
    const { reason } = await request.json();

    await connectDB();

    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Changer le status KYC à "pending" pour demander vérification
    user.kyc = {
      status: 'pending',
      currentSubmission: {
        adminMessage: reason || 'Veuillez soumettre vos documents d\'identité',
        submittedAt: null,
        reviewedAt: null,
        reviewedBy: payload.userId,
        documents: {}
      },
      history: user.kyc?.history || []
    };

    await user.save();

    // 🔔 NOTIFICATION: KYC demandé
    await createNotification(
      userId,
      NotificationTemplates.kycRequested(reason)
    );

    // TODO: Envoyer notification email/SMS au user
    // await sendEmail(user.email, 'Vérification d\'identité requise', ...);
    // await sendSMS(user.phone, 'Veuillez soumettre vos documents KYC');

    return NextResponse.json({
      success: true,
      message: 'Demande de vérification envoyée',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        kycStatus: user.kyc.status
      }
    });

  } catch (error) {
    console.error('Request KYC error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}