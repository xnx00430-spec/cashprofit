// lib/notifications.js
import User from '@/models/User';

/**
 * Créer une notification pour un utilisateur
 */
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

    // Ajouter la notification
    if (!user.notifications) {
      user.notifications = [];
    }
    user.notifications.push(notification);

    // Limiter à 100 notifications max par user
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

/**
 * Templates de notifications
 */
export const NotificationTemplates = {
  // Investissement
  investmentSuccess: (amount, opportunityName) => ({
    type: 'investment_success',
    title: '✅ Investissement réussi',
    message: `Votre investissement de ${amount.toLocaleString()} FCFA dans "${opportunityName}" a été confirmé.`,
    data: { amount, opportunityName }
  }),

  // Retraits
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

  // Parrainage
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

  // KYC
  kycRequested: (reason) => ({
    type: 'kyc_requested',
    title: '📄 Vérification KYC requise',
    message: reason || 'L\'administrateur a demandé une vérification de votre identité. Soumettez vos documents pour débloquer vos retraits.',
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

  // Admin
  adminMessage: (message) => ({
    type: 'admin_message',
    title: '📢 Message administrateur',
    message: message,
    data: { message }
  }),

  // Bonus
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