// app/api/user/upload-avatar/route.js (VERSION CLOUDINARY)
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
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
    const file = formData.get('avatar');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'L\'image ne doit pas dépasser 2MB' },
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

    // Convertir en base64 pour Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload vers Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: 'avatars',
      public_id: `avatar-${user._id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    // URL Cloudinary
    const avatarUrl = uploadResponse.secure_url;

    // Mettre à jour l'avatar dans la DB
    user.avatar = avatarUrl;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      avatarUrl
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}