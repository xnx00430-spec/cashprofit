// lib/notifications.js
import User from '@/models/User';
import { Resend } from 'resend';

// ====== RESEND CONFIG ======
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CashProfit <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cashprofit.com';
const APP_NAME = 'CashProfit';

// ============================================================
// NOTIFICATIONS IN-APP (MongoDB) — ton ancien système
// ============================================================

export async function createNotification(userId, notificationData) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return false;
    }

    const notification = {
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      read: false,
      createdAt: new Date()
    };

    if (!user.notifications) {
      user.notifications = [];
    }
    user.notifications.push(notification);

    if (user.notifications.length > 100) {
      user.notifications = user.notifications.slice(-100);
    }

    await user.save();
    console.log(`✅ Notification créée pour user ${userId}:`, notification.title);
    return true;
  } catch (error) {
    console.error('Create notification error:', error);
    return false;
  }
}

export const NotificationTemplates = {
  investmentSuccess: (amount, opportunityName) => ({
    type: 'investment_success',
    title: '✅ Investissement réussi',
    message: `Votre investissement de ${amount.toLocaleString()} FCFA dans "${opportunityName}" a été confirmé.`,
    data: { amount, opportunityName }
  }),

  withdrawalRequested: (amount, type) => ({
    type: 'withdrawal_requested',
    title: '🕐 Demande de retrait enregistrée',
    message: `Votre demande de retrait de ${amount.toLocaleString()} FCFA (${type}) est en cours de traitement.`,
    data: { amount, type }
  }),

  withdrawalApproved: (amount) => ({
    type: 'withdrawal_approved',
    title: '✅ Retrait approuvé',
    message: `Votre retrait de ${amount.toLocaleString()} FCFA a été approuvé et sera traité sous peu.`,
    data: { amount }
  }),

  withdrawalRejected: (amount, reason) => ({
    type: 'withdrawal_rejected',
    title: '❌ Retrait rejeté',
    message: `Votre retrait de ${amount.toLocaleString()} FCFA a été rejeté. Raison: ${reason}`,
    data: { amount, reason }
  }),

  withdrawalCompleted: (amount) => ({
    type: 'withdrawal_completed',
    title: '🎉 Retrait complété',
    message: `Votre retrait de ${amount.toLocaleString()} FCFA a été envoyé avec succès !`,
    data: { amount }
  }),

  referralRegistered: (referralName, referralCode) => ({
    type: 'referral_registered',
    title: '👥 Nouveau filleul',
    message: `${referralName} s'est inscrit avec votre code ${referralCode} !`,
    data: { referralName, referralCode }
  }),

  referralInvested: (referralName, amount) => ({
    type: 'referral_invested',
    title: '💰 Filleul a investi',
    message: `${referralName} vient d'investir ${amount.toLocaleString()} FCFA !`,
    data: { referralName, amount }
  }),

  commissionEarned: (amount, referralName) => ({
    type: 'commission_earned',
    title: '💸 Commission gagnée',
    message: `Vous avez gagné ${amount.toLocaleString()} FCFA de commission grâce à ${referralName} !`,
    data: { amount, referralName }
  }),

  kycRequested: (reason) => ({
    type: 'kyc_requested',
    title: '📄 Vérification KYC requise',
    message: reason || 'L\'administrateur a demandé une vérification de votre identité.',
    data: { reason }
  }),

  kycApproved: () => ({
    type: 'kyc_approved',
    title: '✅ KYC approuvé',
    message: 'Votre vérification d\'identité a été approuvée ! Vous pouvez maintenant effectuer des retraits.',
    data: {}
  }),

  kycRejected: (reason) => ({
    type: 'kyc_rejected',
    title: '❌ KYC rejeté',
    message: `Votre vérification a été rejetée. Raison: ${reason}. Veuillez resoumettre vos documents.`,
    data: { reason }
  }),

  adminMessage: (message) => ({
    type: 'admin_message',
    title: '📢 Message administrateur',
    message: message,
    data: { message }
  }),

  levelUp: (newLevel) => ({
    type: 'level_up',
    title: '🎊 Niveau supérieur !',
    message: `Félicitations ! Vous avez atteint le niveau ${newLevel} !`,
    data: { level: newLevel }
  }),

  bonusEarned: (amount, reason) => ({
    type: 'bonus_earned',
    title: '🎁 Bonus reçu',
    message: `Vous avez reçu un bonus de ${amount.toLocaleString()} FCFA ! ${reason}`,
    data: { amount, reason }
  })
};


// ============================================================
// EMAILS (Resend) — nouveau système
// ============================================================

function emailTemplate(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-flex;align-items:center;gap:8px;">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:10px;display:inline-block;text-align:center;line-height:36px;">
        <span style="color:#111;font-weight:900;font-size:14px;">CP</span>
      </div>
      <span style="font-size:20px;font-weight:800;color:#111;">Cash<span style="color:#f59e0b;">Profit</span></span>
    </div>
  </div>
  <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    ${content}
  </div>
  <div style="text-align:center;margin-top:24px;color:#9ca3af;font-size:12px;">
    <p>${APP_NAME} — Votre argent travaille pour vous</p>
  </div>
</div></body></html>`;
}

// ====== EMAIL: BIENVENUE ======
export async function sendWelcomeEmail(email, name) {
  const firstName = name?.split(' ')[0] || '';
  try {
    await resend.emails.send({
      from: FROM_EMAIL, to: email,
      subject: `Bienvenue sur ${APP_NAME} !`,
      html: emailTemplate(`
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#111;font-size:24px;font-weight:800;margin:0;">Bienvenue${firstName ? `, ${firstName}` : ''} !</h1>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px;">
          Votre compte ${APP_NAME} a été créé avec succès. Vous pouvez maintenant investir et commencer à gagner de l'argent chaque semaine.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="color:#111;font-size:14px;font-weight:600;margin:0 0 12px 0;">Pour commencer :</p>
          <p style="color:#374151;font-size:13px;margin:6px 0;"><strong>1.</strong> Faites votre premier investissement à partir de 10,000 FCFA</p>
          <p style="color:#374151;font-size:13px;margin:6px 0;"><strong>2.</strong> Regardez vos gains augmenter en temps réel</p>
          <p style="color:#374151;font-size:13px;margin:6px 0;"><strong>3.</strong> Retirez vos bénéfices quand vous voulez</p>
        </div>
        <a href="${APP_URL}/user" style="display:block;text-align:center;background:#111;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">
          Accéder à mon compte
        </a>
      `)
    });
    console.log(`✅ Email bienvenue → ${email}`);
  } catch (e) { console.error('❌ Email bienvenue:', e); }
}

// ====== EMAIL: INVESTISSEMENT CONFIRMÉ ======
export async function sendInvestmentEmail(email, name, { amount, opportunityName, rate }) {
  const firstName = name?.split(' ')[0] || '';
  const weeklyGain = Math.round(amount * (rate / 100));
  try {
    await resend.emails.send({
      from: FROM_EMAIL, to: email,
      subject: `Investissement de ${amount.toLocaleString('fr-FR')} FCFA confirmé`,
      html: emailTemplate(`
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#111;font-size:24px;font-weight:800;margin:0;">Investissement confirmé</h1>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px;">
          ${firstName ? `${firstName}, votre` : 'Votre'} investissement a été activé. Vos gains commencent maintenant.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Opportunité</td><td style="color:#111;font-size:13px;font-weight:600;text-align:right;">${opportunityName}</td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Montant investi</td><td style="color:#111;font-size:13px;font-weight:600;text-align:right;">${amount.toLocaleString('fr-FR')} FCFA</td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Taux</td><td style="color:#16a34a;font-size:13px;font-weight:700;text-align:right;">${rate}% / semaine</td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;border-top:1px solid #d1fae5;">Gains estimés / semaine</td><td style="color:#16a34a;font-size:16px;font-weight:800;text-align:right;border-top:1px solid #d1fae5;">+${weeklyGain.toLocaleString('fr-FR')} F</td></tr>
          </table>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-bottom:20px;">Vos bénéfices s'affichent en temps réel. Retirez vos gains à tout moment dès 1,000 FCFA.</p>
        <a href="${APP_URL}/user" style="display:block;text-align:center;background:#111;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">
          Voir mes gains en direct
        </a>
      `)
    });
    console.log(`✅ Email investissement → ${email}`);
  } catch (e) { console.error('❌ Email investissement:', e); }
}

// ====== EMAIL: RETRAIT DEMANDÉ ======
export async function sendWithdrawalRequestedEmail(email, name, { amount, type, method }) {
  const firstName = name?.split(' ')[0] || '';
  const typeLabel = type === 'gains' ? 'Bénéfices' : type === 'commissions' ? 'Commissions' : 'Bonus';
  try {
    await resend.emails.send({
      from: FROM_EMAIL, to: email,
      subject: `Retrait de ${amount.toLocaleString('fr-FR')} FCFA en cours`,
      html: emailTemplate(`
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#111;font-size:24px;font-weight:800;margin:0;">Retrait en cours</h1>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px;">
          ${firstName ? `${firstName}, votre` : 'Votre'} demande de retrait a été enregistrée. Vous recevrez l'argent sous 24 heures.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Montant</td><td style="color:#111;font-size:16px;font-weight:800;text-align:right;">${amount.toLocaleString('fr-FR')} FCFA</td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Type</td><td style="color:#111;font-size:13px;font-weight:600;text-align:right;">${typeLabel}</td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Méthode</td><td style="color:#111;font-size:13px;font-weight:600;text-align:right;">${method || 'Mobile Money'}</td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding:6px 0;">Délai</td><td style="color:#f59e0b;font-size:13px;font-weight:600;text-align:right;">Moins de 24 heures</td></tr>
          </table>
        </div>
        <p style="color:#9ca3af;font-size:12px;">Vous recevrez un email quand l'argent sera envoyé.</p>
      `)
    });
    console.log(`✅ Email retrait demandé → ${email}`);
  } catch (e) { console.error('❌ Email retrait:', e); }
}

// ====== EMAIL: RETRAIT COMPLÉTÉ ======
export async function sendWithdrawalCompletedEmail(email, name, { amount, method }) {
  const firstName = name?.split(' ')[0] || '';
  try {
    await resend.emails.send({
      from: FROM_EMAIL, to: email,
      subject: `${amount.toLocaleString('fr-FR')} FCFA envoyés sur votre compte`,
      html: emailTemplate(`
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#111;font-size:24px;font-weight:800;margin:0;">Argent envoyé !</h1>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px;">
          ${firstName ? `${firstName}, ` : ''}votre retrait a été traité avec succès.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
          <div style="color:#6b7280;font-size:13px;margin-bottom:4px;">Montant envoyé</div>
          <div style="color:#16a34a;font-size:32px;font-weight:900;">${amount.toLocaleString('fr-FR')} FCFA</div>
          <div style="color:#6b7280;font-size:12px;margin-top:4px;">sur votre ${method || 'Mobile Money'}</div>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-bottom:20px;">Si vous n'avez pas reçu l'argent, contactez notre support.</p>
        <a href="${APP_URL}/user" style="display:block;text-align:center;background:#111;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">
          Continuer à investir
        </a>
      `)
    });
    console.log(`✅ Email retrait complété → ${email}`);
  } catch (e) { console.error('❌ Email retrait complété:', e); }
}


// ============================================================
// FONCTION COMBINÉE : notification in-app + email
// Appelle cette fonction unique dans tes routes
// ============================================================

export async function notify(userId, template, emailData = null) {
  // 1. Notification in-app (toujours)
  await createNotification(userId, template);

  // 2. Email (si emailData fourni)
  if (emailData?.sendEmail && emailData?.email) {
    try {
      switch (emailData.type) {
        case 'welcome':
          await sendWelcomeEmail(emailData.email, emailData.name);
          break;
        case 'investment':
          await sendInvestmentEmail(emailData.email, emailData.name, emailData);
          break;
        case 'withdrawal_requested':
          await sendWithdrawalRequestedEmail(emailData.email, emailData.name, emailData);
          break;
        case 'withdrawal_completed':
          await sendWithdrawalCompletedEmail(emailData.email, emailData.name, emailData);
          break;
      }
    } catch (e) { console.error('❌ Email error:', e); }
  }
}