import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@invest-app.com';
const FROM_NAME = 'INVEST App';

/**
 * Envoyer un email générique
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const data = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    });

    console.log('✅ Email envoyé:', data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email de bienvenue après inscription
 */
export async function sendWelcomeEmail(user) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #fcd535; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .highlight { background: #fcd535; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur INVEST !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.name} ! 👋</h2>
            <p>Félicitations ! Votre compte a été créé avec succès.</p>
            
            <div class="highlight">
              <strong>Votre code parrain :</strong> <span style="font-size: 20px; font-weight: bold;">${user.sponsorCode}</span>
              <br>
              <small>Partagez ce code pour inviter vos amis et gagner des commissions !</small>
            </div>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/user" class="button">Accéder à mon compte</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: '🎉 Bienvenue sur INVEST !',
    html,
    text: `Bienvenue ${user.name} ! Votre code parrain : ${user.sponsorCode}`
  });
}

/**
 * Email de confirmation KYC approuvé
 */
export async function sendKYCApprovedEmail(user) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>✅ KYC Approuvé !</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Bonjour ${user.name} ! 🎊</h2>
            <p>Votre vérification KYC a été approuvée avec succès.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/user" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Voir mon compte</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: '✅ Votre KYC a été approuvé !',
    html,
    text: `Bonjour ${user.name}, votre KYC a été approuvé !`
  });
}

/**
 * Email de rejet KYC
 */
export async function sendKYCRejectedEmail(user, reason) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>⚠️ KYC Non Approuvé</h2>
          <p>Bonjour ${user.name},</p>
          <p><strong>Raison :</strong> ${reason}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/kyc" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Soumettre à nouveau</a>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: '⚠️ Votre KYC nécessite une correction',
    html
  });
}

/**
 * Email de retrait approuvé
 */
export async function sendWithdrawalApprovedEmail(user, withdrawal) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>💰 Retrait Approuvé</h2>
          <p>Bonjour ${user.name},</p>
          <p><strong>Montant :</strong> ${withdrawal.amount.toLocaleString()} FCFA</p>
          <p>Le paiement sera effectué sous 24-48 heures.</p>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: '💰 Votre retrait a été approuvé',
    html
  });
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendKYCApprovedEmail,
  sendKYCRejectedEmail,
  sendWithdrawalApprovedEmail
};