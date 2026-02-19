import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { createNotification, NotificationTemplates, sendWelcomeEmail } from '@/lib/notifications';

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
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérifier si le numéro de téléphone existe déjà
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const existingPhone = await User.findOne({ 
      $or: [
        { phone: cleanedPhone },
        { phone: '+' + cleanedPhone.replace(/^\+/, '') }
      ]
    });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: 'Ce numéro de téléphone est déjà utilisé' },
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
      phone: cleanedPhone,
      address: address || '',
      sponsorCode,
      referralCode: sponsorCode,
      referredBy: referrer?._id || null,
      referredByCode: referralCode?.toUpperCase() || null,
      status: 'active',
      level: 1,
      kyc: {
        status: 'null'
      }
    });

    // Ajouter aux affiliés du parrain
    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $push: { referrals: user._id }
      });
      
      await createNotification(
        referrer._id,
        NotificationTemplates.referralRegistered(name, referralCode.toUpperCase())
      );
    }

    // ✉️ EMAIL: Bienvenue
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    // Générer les tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

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

    const isProduction = process.env.NODE_ENV === 'production';
    
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

    return response;

  } catch (error) {
    console.error('❌ Register error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const msg = field === 'phone' 
        ? 'Ce numéro de téléphone est déjà utilisé' 
        : field === 'email'
          ? 'Cet email est déjà utilisé'
          : 'Ce compte existe déjà';
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'inscription', error: error.message },
      { status: 500 }
    );
  }
}