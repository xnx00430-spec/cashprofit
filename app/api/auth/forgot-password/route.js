// app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cashprofit.net';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email requis' },
        { status: 400 }
      );
    }

    await connectDB();

    // Chercher par email OU téléphone
    const input = email.trim();
    const isPhone = /^[\+\d]/.test(input) && !input.includes('@');

    let user;
    if (isPhone) {
      const cleaned = input.replace(/[\s\-\(\)]/g, '');
      const digitsOnly = cleaned.replace(/\+/g, '');
      const phoneVariants = [cleaned, '+' + digitsOnly, digitsOnly];
      if (cleaned.startsWith('0')) {
        phoneVariants.push('+225' + cleaned);
        phoneVariants.push('+225' + cleaned.substring(1));
      }
      user = await User.findOne({
        $or: [
          { phone: { $in: phoneVariants } },
          { phone: { $regex: digitsOnly.slice(-8) + '$' } }
        ]
      });
    } else {
      user = await User.findOne({ email: input.toLowerCase() });
    }

    // Toujours retourner succès (même si user pas trouvé) pour ne pas révéler si un compte existe
    if (!user || !user.email) {
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet identifiant, un email de réinitialisation a été envoyé.'
      });
    }

    // Générer un token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Sauvegarder en DB
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Lien de reset
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Envoyer l'email
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'CashProfit <noreply@cashprofit.net>',
        to: user.email,
        subject: 'Réinitialisez votre mot de passe - CashProfit',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
              
              <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);padding:12px 24px;border-radius:16px;">
                  <span style="color:white;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Cash<span style="color:#fef3c7;">Profit</span></span>
                </div>
              </div>

              <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
                
                <h1 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px 0;">Réinitialisation de votre mot de passe</h1>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                  Bonjour ${user.name?.split(' ')[0] || ''},<br><br>
                  Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau.
                </p>

                <div style="text-align:center;margin:32px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;">
                    Réinitialiser mon mot de passe
                  </a>
                </div>

                <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:24px 0;">
                  <p style="color:#92400e;font-size:12px;margin:0;line-height:1.5;">
                    ⏰ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
                  </p>
                </div>

                <p style="color:#9ca3af;font-size:11px;line-height:1.5;margin:24px 0 0 0;">
                  Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                  <span style="color:#6b7280;word-break:break-all;">${resetUrl}</span>
                </p>
              </div>

              <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:24px;">
                © ${new Date().getFullYear()} CashProfit. Tous droits réservés.
              </p>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`📧 Reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Ne pas bloquer si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet identifiant, un email de réinitialisation a été envoyé.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}