// app/api/user/kyc/submit/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
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
    
    // Récupérer les données du formulaire
    const fullName = formData.get('fullName');
    const birthDate = formData.get('birthDate');
    const idNumber = formData.get('idNumber');
    const nationality = formData.get('nationality');
    const address = formData.get('address');
    
    // Récupérer les fichiers
    const idCardFront = formData.get('idCardFront');
    const idCardBack = formData.get('idCardBack');
    const selfie = formData.get('selfie');
    const proofOfAddress = formData.get('proofOfAddress');

    // Validation
    if (!fullName || !birthDate || !idNumber || !nationality || !address) {
      return NextResponse.json(
        { success: false, message: 'Toutes les informations personnelles sont requises' },
        { status: 400 }
      );
    }

    if (!idCardFront || !idCardBack || !selfie) {
      return NextResponse.json(
        { success: false, message: 'Les 3 documents obligatoires sont requis (CNI recto, verso, selfie)' },
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

    const [idFrontUrl, idBackUrl, selfieUrl, proofOfAddressUrl] = await Promise.all([
      uploadToCloudinary(idCardFront, 'id-front'),
      uploadToCloudinary(idCardBack, 'id-back'),
      uploadToCloudinary(selfie, 'selfie'),
      proofOfAddress ? uploadToCloudinary(proofOfAddress, 'proof-address') : Promise.resolve(null)
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

    // ==================== SAUVEGARDER NOUVELLE SOUMISSION ====================
    user.kyc = user.kyc || {};
    user.kyc.status = 'pending';
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
        proofOfAddress: proofOfAddressUrl
      },
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      adminMessage: null,
      autoApprovedAt: null
    };

    await user.save();

    console.log('✅ KYC soumis, statut: pending');

    // ==================== AUTO-VALIDATION APRÈS 3 MINUTES ====================
    setTimeout(async () => {
      try {
        await connectDB();
        
        const userToUpdate = await User.findById(user._id);
        
        // Vérifier que le KYC est toujours en pending (pas rejeté par admin entre temps)
        if (userToUpdate && userToUpdate.kyc.status === 'pending') {
          userToUpdate.kyc.status = 'approved';
          if (!userToUpdate.kyc.currentSubmission) {
            userToUpdate.kyc.currentSubmission = {};
          }
          userToUpdate.kyc.currentSubmission.autoApprovedAt = new Date();
          userToUpdate.kyc.currentSubmission.reviewedAt = new Date();
          await userToUpdate.save();

          console.log(`✅ KYC auto-approuvé pour ${userToUpdate.firstName} ${userToUpdate.lastName}`);

          // 🔔 NOTIFICATION: KYC approuvé
          await createNotification(
            userToUpdate._id,
            NotificationTemplates.kycApproved()
          );

          console.log('✅ Notification KYC approuvé envoyée');
        }
      } catch (error) {
        console.error('❌ Erreur auto-validation KYC:', error);
      }
    }, 3 * 60 * 1000); // 3 minutes

    return NextResponse.json({
      success: true,
      message: 'Documents KYC soumis avec succès. Validation automatique dans 3 minutes...',
      kyc: {
        status: 'pending',
        submittedAt: user.kyc.currentSubmission.submittedAt,
        estimatedApprovalTime: '3 minutes'
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