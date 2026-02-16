import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Envoyer un SMS générique
 */
export async function sendSMS(to, message) {
  try {
    // Formater le numéro (ajouter +225 si nécessaire pour Côte d'Ivoire)
    const formattedNumber = to.startsWith('+') ? to : `+225${to}`;

    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: formattedNumber
    });

    console.log('✅ SMS envoyé:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * SMS de bienvenue après inscription
 */
export async function sendWelcomeSMS(user) {
  const message = `Bienvenue sur INVEST ${user.name} ! Votre code parrain : ${user.sponsorCode}. Partagez-le pour gagner des commissions !`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de confirmation KYC approuvé
 */
export async function sendKYCApprovedSMS(user) {
  const message = `${user.name}, votre KYC a été approuvé ! Vous pouvez maintenant effectuer des retraits. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de rejet KYC
 */
export async function sendKYCRejectedSMS(user, reason) {
  const message = `${user.name}, votre KYC a été rejeté. Raison: ${reason}. Veuillez soumettre à nouveau vos documents. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de retrait approuvé
 */
export async function sendWithdrawalApprovedSMS(user, amount) {
  const message = `${user.name}, votre retrait de ${amount.toLocaleString()} FCFA a été approuvé ! Paiement sous 24-48h. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de retrait complété
 */
export async function sendWithdrawalCompletedSMS(user, amount, transactionId) {
  const message = `${user.name}, votre retrait de ${amount.toLocaleString()} FCFA a été effectué ! ID: ${transactionId}. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de gains hebdomadaires
 */
export async function sendWeeklyGainsSMS(user, amount) {
  const message = `${user.name}, vous avez reçu ${amount.toLocaleString()} FCFA de gains cette semaine ! Consultez votre solde. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de nouveau filleul
 */
export async function sendNewReferralSMS(sponsor, referralName) {
  const message = `${sponsor.name}, ${referralName} vient de s'inscrire avec votre code ! Vous gagnerez des commissions sur ses gains. INVEST App`;
  return await sendSMS(sponsor.phone, message);
}

/**
 * SMS de nouvelle commission
 */
export async function sendNewCommissionSMS(user, amount) {
  const message = `${user.name}, vous avez reçu ${amount.toLocaleString()} FCFA de commission de votre réseau ! INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de compte bloqué
 */
export async function sendAccountBlockedSMS(user, reason) {
  const message = `${user.name}, votre compte a été bloqué. Raison: ${reason}. Contactez le support. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de compte débloqué
 */
export async function sendAccountUnblockedSMS(user) {
  const message = `${user.name}, votre compte a été débloqué ! Vous pouvez à nouveau accéder à toutes les fonctionnalités. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de changement de niveau
 */
export async function sendLevelUpSMS(user, newLevel) {
  const message = `Félicitations ${user.name} ! Vous êtes passé au niveau ${newLevel} ! Débloquez de nouveaux avantages. INVEST App`;
  return await sendSMS(user.phone, message);
}

/**
 * SMS de code de vérification (2FA)
 */
export async function send2FACode(user, code) {
  const message = `Votre code de vérification INVEST : ${code}. Valide 10 minutes. Ne le partagez avec personne.`;
  return await sendSMS(user.phone, message);
}

export default {
  sendSMS,
  sendWelcomeSMS,
  sendKYCApprovedSMS,
  sendKYCRejectedSMS,
  sendWithdrawalApprovedSMS,
  sendWithdrawalCompletedSMS,
  sendWeeklyGainsSMS,
  sendNewReferralSMS,
  sendNewCommissionSMS,
  sendAccountBlockedSMS,
  sendAccountUnblockedSMS,
  sendLevelUpSMS,
  send2FACode
};