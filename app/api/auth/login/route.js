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

    // ========== FIX : Chercher par email OU par téléphone ==========
    // Détecter si c'est un numéro de téléphone (commence par + ou chiffre)
    const isPhone = /^[\+\d]/.test(input) && !input.includes('@');

    let user;

    if (isPhone) {
      // Nettoyer le numéro : enlever espaces, tirets, parenthèses
      let cleaned = input.replace(/[\s\-\(\)]/g, '');

      // Chercher par phone exact OU avec variantes de préfixe
      user = await User.findOne({
        $or: [
          { phone: cleaned },
          { phone: '+' + cleaned },
          // Si le user tape "0700000000", chercher aussi "+2250700000000"
          { phone: { $regex: cleaned.replace(/^0/, ''), $options: 'i' } },
          // Chercher aussi dans le faux email généré à l'inscription
          { email: cleaned.replace(/\+/g, '') + '@invest.com' },
          { email: '+' + cleaned.replace(/\+/g, '') + '@invest.com' },
        ]
      }).select('+password');
    } else {
      // Chercher par email classique
      user = await User.findOne({ email: input.toLowerCase() }).select('+password');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: isPhone ? 'Numéro de téléphone ou mot de passe incorrect' : 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Identifiant ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier si le compte est bloqué
    if (user.status === 'blocked') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Votre compte est bloqué',
          reason: user.blockReason || 'Compte suspendu. Contactez le support.'
        },
        { status: 403 }
      );
    }

    // Générer les tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        status: user.status,
        role: user.role,
        sponsorCode: user.sponsorCode,
        referredByCode: user.referredByCode,
        level: user.level,
        balance: user.balance,
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
        totalWithdrawn: user.totalWithdrawn,
        totalCommissions: user.totalCommissions,
        kyc: user.kyc,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }, { status: 200 });

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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la connexion', error: error.message },
      { status: 500 }
    );
  }
}