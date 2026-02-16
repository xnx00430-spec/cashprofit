import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Détails d'une vérification KYC (ADMIN ONLY)
export async function GET(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(params.id)
      .select('name email phone address kyc totalInvested createdAt')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        totalInvested: user.totalInvested,
        memberSince: user.createdAt
      },
      kyc: {
        status: user.kyc.status,
        fullName: user.kyc.fullName,
        dateOfBirth: user.kyc.dateOfBirth,
        nationality: user.kyc.nationality,
        idNumber: user.kyc.idNumber,
        documents: {
          idCardFront: user.kyc.idCardFront,
          idCardBack: user.kyc.idCardBack,
          selfie: user.kyc.selfie,
          addressProof: user.kyc.addressProof
        },
        submittedAt: user.kyc.submittedAt,
        verifiedAt: user.kyc.verifiedAt,
        rejectedAt: user.kyc.rejectedAt,
        rejectionReason: user.kyc.rejectionReason
      }
    });

  } catch (error) {
    console.error('Admin get KYC details error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Approuver ou Rejeter KYC (ADMIN ONLY)
export async function PUT(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { action, reason } = await request.json();

    if (!action || !['approve', 'reject', 'request_more'].includes(action)) {
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

    await connectDB();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Appliquer l'action
    switch (action) {
      case 'approve':
        user.kyc.status = 'approved';
        user.kyc.verifiedAt = new Date();
        user.kyc.verifiedBy = payload.userId;
        user.status = 'confirmed'; // Confirmer le compte
        break;

      case 'reject':
        user.kyc.status = 'rejected';
        user.kyc.rejectedAt = new Date();
        user.kyc.rejectionReason = reason;
        user.kyc.verifiedBy = payload.userId;
        break;

      case 'request_more':
        user.kyc.status = 'need_more_info';
        user.kyc.rejectionReason = reason;
        break;
    }

    await user.save();

    // TODO: Envoyer email/SMS de notification

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'KYC approuvé avec succès'
        : action === 'reject'
        ? 'KYC rejeté'
        : 'Informations supplémentaires demandées',
      kyc: {
        status: user.kyc.status,
        verifiedAt: user.kyc.verifiedAt,
        rejectedAt: user.kyc.rejectedAt,
        rejectionReason: user.kyc.rejectionReason
      }
    });

  } catch (error) {
    console.error('Admin KYC action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}