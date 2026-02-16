import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, password, phone, address, referralCode } = await request.json();

    // Validation
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérifier le code parrain si fourni
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ sponsorCode: referralCode.toUpperCase() });
      if (!referrer) {
        return NextResponse.json(
          { success: false, message: 'Code parrain invalide' },
          { status: 400 }
        );
      }
    }

    // Générer un code parrain unique
    const sponsorCode = await User.generateSponsorCode();

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address: address || '',
      sponsorCode,
      referralCode: sponsorCode, // Même code pour les deux champs
      referredBy: referrer?._id || null,
      referredByCode: referralCode?.toUpperCase() || null,
      status: 'active',
      level: 1,
      kyc: {
        status: 'null'
      }
    });

    // Ajouter aux filleuls du parrain
    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $push: { referrals: user._id }
      });
      
      // 🔔 NOTIFICATION: Nouveau filleul inscrit
      await createNotification(
        referrer._id,
        NotificationTemplates.referralRegistered(name, referralCode.toUpperCase())
      );
    }

    // Générer les tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    console.log('🔑 Tokens générés:', {
      accessToken: accessToken.substring(0, 30) + '...',
      refreshToken: refreshToken.substring(0, 30) + '...',
      userId: user._id.toString(),
      userRole: user.role
    });

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // CRÉER LA RÉPONSE
    const response = NextResponse.json({
      success: true,
      message: 'Inscription réussie !',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role,
        sponsorCode: user.sponsorCode,
        referredByCode: user.referredByCode,
        level: user.level,
        kyc: user.kyc
      }
    }, { status: 201 });

    // SET COOKIES VIA HEADERS
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log('🍪 Configuration cookies:', {
      isProduction,
      NODE_ENV: process.env.NODE_ENV,
      secure: isProduction
    });
    
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });

    console.log('✅ Cookies ajoutés à la réponse:', response.cookies.getAll());

    return response;

  } catch (error) {
    console.error('❌ Register error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Cet email ou code parrain existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'inscription', error: error.message },
      { status: 500 }
    );
  }
}