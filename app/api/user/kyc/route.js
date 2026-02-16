import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Statut KYC actuel
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId)
      .select('kyc name email phone')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      kyc: {
        status: user.kyc.status,
        submittedAt: user.kyc.submittedAt,
        verifiedAt: user.kyc.verifiedAt,
        rejectedAt: user.kyc.rejectedAt,
        rejectionReason: user.kyc.rejectionReason,
        documents: {
          idCard: !!user.kyc.idCardFront,
          selfie: !!user.kyc.selfie,
          address: !!user.kyc.addressProof
        },
        personalInfo: {
          fullName: user.kyc.fullName || user.name,
          dateOfBirth: user.kyc.dateOfBirth,
          nationality: user.kyc.nationality,
          idNumber: user.kyc.idNumber ? '****' + user.kyc.idNumber.slice(-4) : null
        }
      }
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Soumettre KYC
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const fullName = formData.get('fullName');
    const dateOfBirth = formData.get('dateOfBirth');
    const nationality = formData.get('nationality');
    const idNumber = formData.get('idNumber');
    const idCardFront = formData.get('idCardFront');
    const idCardBack = formData.get('idCardBack');
    const selfie = formData.get('selfie');
    const addressProof = formData.get('addressProof');

    // Validation
    if (!fullName || !dateOfBirth || !nationality || !idNumber) {
      return NextResponse.json(
        { success: false, message: 'Informations personnelles manquantes' },
        { status: 400 }
      );
    }

    if (!idCardFront || !selfie) {
      return NextResponse.json(
        { success: false, message: 'Documents obligatoires manquants (Pièce d\'identité et Selfie)' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si KYC déjà approuvé
    if (user.kyc.status === 'approved') {
      return NextResponse.json(
        { success: false, message: 'KYC déjà approuvé' },
        { status: 400 }
      );
    }

    // TODO: Upload files to Cloudinary
    // Pour l'instant, on simule les URLs
    const idCardFrontUrl = 'https://cloudinary.com/placeholder-id-front';
    const idCardBackUrl = idCardBack ? 'https://cloudinary.com/placeholder-id-back' : null;
    const selfieUrl = 'https://cloudinary.com/placeholder-selfie';
    const addressProofUrl = addressProof ? 'https://cloudinary.com/placeholder-address' : null;

    // Mettre à jour le KYC
    user.kyc = {
      status: 'pending',
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      idNumber,
      idCardFront: idCardFrontUrl,
      idCardBack: idCardBackUrl,
      selfie: selfieUrl,
      addressProof: addressProofUrl,
      submittedAt: new Date()
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'KYC soumis avec succès. En attente de vérification.',
      kyc: {
        status: user.kyc.status,
        submittedAt: user.kyc.submittedAt,
        estimatedVerificationTime: '24-48 heures'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Submit KYC error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la soumission' },
      { status: 500 }
    );
  }
}