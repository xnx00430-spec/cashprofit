// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Données manquantes' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    await connectDB();

    // Hash le token pour comparer avec la DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Chercher le user avec ce token ET non expiré
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Lien invalide ou expiré. Veuillez refaire une demande.' },
        { status: 400 }
      );
    }

    // Changer le mot de passe
    user.password = password; // Le pre-save hook va le hasher
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`🔐 Password reset for ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}