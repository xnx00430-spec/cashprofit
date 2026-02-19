// app/api/user/kyc/submit/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    const birthDate = formData.get('birthDate');
    const idNumber = formData.get('idNumber');
    const nationality = formData.get('nationality');
    const address = formData.get('address');
    
    const idCardFront = formData.get('idCardFront');
    const idCardBackRaw = formData.get('idCardBack');
    const idCardBack = (idCardBackRaw && typeof idCardBackRaw !== 'string' && idCardBackRaw.size > 0) ? idCardBackRaw : null;
    const selfie = formData.get('selfie');
    const proofOfAddressRaw = formData.get('proofOfAddress');
    const proofOfAddress = (proofOfAddressRaw && typeof proofOfAddressRaw !== 'string' && proofOfAddressRaw.size > 0) ? proofOfAddressRaw : null;

    if (!fullName || !birthDate || !idNumber || !nationality || !address) {
      return NextResponse.json(
        { success: false, message: 'Toutes les informations personnelles sont requises' },
        { status: 400 }
      );
    }

    const docType = formData.get('docType') || 'cni';
    const needsBack = docType !== 'passport';

    if (!idCardFront || !selfie) {
      return NextResponse.json(
        { success: false, message: 'Le recto du document et le selfie sont requis' },
        { status: 400 }
      );
    }

    if (needsBack && !idCardBack) {
      return NextResponse.json(
        { success: false, message: 'Le verso du document est requis' },
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

    // ==================== UPLOAD VERS CLOUDINARY ====================
    const uploadToCloudinary = async (file, folder) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `kyc/${user._id}/${folder}`,
        resource_type: 'auto'
      });

      return result.secure_url;
    };

    console.log('📤 Upload des documents vers Cloudinary...');

    const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
      uploadToCloudinary(idCardFront, 'id-front'),
      idCardBack ? uploadToCloudinary(idCardBack, 'id-back') : Promise.resolve(null),
      uploadToCloudinary(selfie, 'selfie')
    ]);

    console.log('✅ Documents uploadés avec succès');

    // ==================== ARCHIVER ANCIENNE SOUMISSION ====================
    if (user.kyc?.currentSubmission?.submittedAt) {
      if (!user.kyc.history) {
        user.kyc.history = [];
      }
      user.kyc.history.push({
        status: user.kyc.status,
        submittedAt: user.kyc.currentSubmission.submittedAt,
        reviewedAt: user.kyc.currentSubmission.reviewedAt,
        reviewedBy: user.kyc.currentSubmission.reviewedBy,
        adminMessage: user.kyc.currentSubmission.adminMessage,
        documents: user.kyc.currentSubmission.documents
      });
    }

    // ==================== AUTO-APPROVE IMMÉDIAT ====================
    const now = new Date();
    
    user.kyc = user.kyc || {};
    user.kyc.status = 'approved';
    user.kyc.currentSubmission = {
      personalInfo: {
        fullName,
        birthDate: new Date(birthDate),
        idNumber,
        nationality,
        address
      },
      documents: {
        idFront: idFrontUrl,
        idBack: idBackUrl,
        selfie: selfieUrl,
        proofOfAddress: null
      },
      submittedAt: now,
      reviewedAt: now,
      reviewedBy: null,
      adminMessage: null,
      autoApprovedAt: now
    };

    await user.save();

    console.log(`✅ KYC auto-approuvé pour ${user.name}`);

    try {
      await createNotification(
        user._id,
        NotificationTemplates.kycApproved()
      );
    } catch (e) {
      console.error('Notification KYC error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Documents vérifiés avec succès !',
      kyc: {
        status: 'approved',
        submittedAt: now,
        approvedAt: now
      }
    });

  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la soumission des documents' },
      { status: 500 }
    );
  }
}