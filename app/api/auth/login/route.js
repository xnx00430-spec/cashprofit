import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Identifiant et mot de passe requis' },
        { status: 400 }
      );
    }

    const input = email.trim();
    const isPhone = /^[\+\d]/.test(input) && !input.includes('@');

    let user;

    if (isPhone) {
      let cleaned = input.replace(/[\s\-\(\)]/g, '');
      const digitsOnly = cleaned.replace(/\+/g, '');
      
      // Construire toutes les variantes possibles
      const phoneVariants = [
        cleaned,
        '+' + digitsOnly,
        digitsOnly,
      ];
      
      // Si commence par 0, ajouter avec préfixe +225
      if (cleaned.startsWith('0')) {
        phoneVariants.push('+225' + cleaned);        // +2250501239797
        phoneVariants.push('+225' + cleaned.substring(1)); // +225501239797
        phoneVariants.push('225' + cleaned);
        phoneVariants.push('225' + cleaned.substring(1));
      }
      
      // Chercher par correspondance exacte OU par les 8 derniers chiffres
      user = await User.findOne({
        $or: [
          { phone: { $in: phoneVariants } },
          { phone: { $regex: digitsOnly.slice(-8) + '$' } }
        ]
      }).select('+password');
      
    } else {
      user = await User.findOne({ email: input.toLowerCase() }).select('+password');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: isPhone ? 'Numéro de téléphone ou mot de passe incorrect' : 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Identifiant ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (user.status === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'Votre compte est bloqué', reason: user.blockReason || 'Compte suspendu. Contactez le support.' },
        { status: 403 }
      );
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.lastLogin = new Date();
    await user.save();

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user._id, name: user.name, email: user.email, phone: user.phone,
        address: user.address, avatar: user.avatar, status: user.status, role: user.role,
        sponsorCode: user.sponsorCode, referredByCode: user.referredByCode,
        level: user.level, balance: user.balance, totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings, totalWithdrawn: user.totalWithdrawn,
        totalCommissions: user.totalCommissions, kyc: user.kyc,
        twoFactorEnabled: user.twoFactorEnabled, emailVerified: user.emailVerified,
        lastLogin: user.lastLogin, createdAt: user.createdAt
      }
    }, { status: 200 });

    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true, secure: isProduction, sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, path: '/'
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true, secure: isProduction, sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la connexion', error: error.message },
      { status: 500 }
    );
  }
}