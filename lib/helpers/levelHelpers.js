// lib/helpers/levelHelpers.js

/**
 * Calculer le bonus de taux selon le niveau
 * @param {Number} level - Niveau de l'utilisateur
 * @returns {Number} Bonus en pourcentage
 */
export function calculateRateBonus(level) {
  if (level === 1) return 0;
  if (level === 2) return 5;
  return 10; // Niveau 3+
}

/**
 * Calculer le taux final d'une opportunité
 * @param {Number} baseRate - Taux de base de l'opportunité
 * @param {Number} userLevel - Niveau de l'utilisateur
 * @returns {Number} Taux final
 */
export function calculateFinalRate(baseRate, userLevel) {
  const bonus = calculateRateBonus(userLevel);
  return baseRate + bonus;
}

/**
 * Calculer l'objectif de cagnotte pour un niveau
 * @param {Number} userInvestment - Montant investi par l'utilisateur
 * @returns {Number} Objectif de cagnotte (investissement × 5)
 */
export function calculateLevelTarget(userInvestment) {
  return userInvestment * 5;
}

/**
 * Calculer la deadline d'un niveau
 * @param {Number} level - Niveau actuel
 * @returns {Date} Date de deadline
 */
export function calculateLevelDeadline(level) {
  const weeks = level === 1 ? 3 : 2;
  return new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
}

/**
 * Vérifier si un utilisateur peut passer au niveau suivant
 * @param {Object} user - Document utilisateur
 * @returns {Boolean}
 */
export function canLevelUp(user) {
  return user.currentLevelCagnotte >= user.currentLevelTarget;
}

/**
 * Calculer le temps restant avant deadline
 * @param {Date} deadline - Date de deadline
 * @returns {Object} { days, hours, expired }
 */
export function getTimeRemaining(deadline) {
  const now = new Date();
  const diff = deadline - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, expired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { days, hours, expired: false };
}

/**
 * Calculer la progression en pourcentage
 * @param {Number} current - Valeur actuelle
 * @param {Number} target - Valeur cible
 * @returns {Number} Pourcentage (0-100)
 */
export function calculateProgress(current, target) {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Formater un montant en FCFA
 * @param {Number} amount - Montant
 * @returns {String} Montant formaté
 */
export function formatAmount(amount) {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Calculer les bénéfices estimés d'un investissement
 * @param {Number} amount - Montant investi
 * @param {Number} rate - Taux (en %)
 * @returns {Object} { benefits, total }
 */
export function calculateInvestmentReturns(amount, rate) {
  const benefits = amount * (rate / 100);
  const total = amount + benefits;
  
  return {
    benefits: Math.round(benefits),
    total: Math.round(total)
  };
}

/**
 * Vérifier si c'est le premier investissement d'un utilisateur
 * @param {Object} user - Document utilisateur
 * @param {Number} currentAmount - Montant de l'investissement en cours
 * @returns {Boolean}
 */
export function isFirstInvestment(user, currentAmount) {
  return user.totalInvested === 0 || user.totalInvested === currentAmount;
}

export default {
  calculateRateBonus,
  calculateFinalRate,
  calculateLevelTarget,
  calculateLevelDeadline,
  canLevelUp,
  getTimeRemaining,
  calculateProgress,
  formatAmount,
  calculateInvestmentReturns,
  isFirstInvestment
};