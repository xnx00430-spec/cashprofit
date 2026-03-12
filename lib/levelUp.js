// lib/levelUp.js
// ============================================================
// Fonction utilitaire pour gérer le level up d'un utilisateur
// 1. Sync les gains au taux actuel (avant le changement)
// 2. Level up le user
// 3. Met à jour le weeklyRate de tous les investissements actifs
// ============================================================

import Investment from '@/models/Investment';
import User from '@/models/User';

const REFERRER_CUT = 0.10;

/**
 * Sync les gains non-synchronisés de tous les investissements actifs
 * DOIT être appelé AVANT de changer le taux pour ne pas recalculer le passé
 */
async function syncEarningsBeforeRateChange(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const investments = await Investment.find({ userId, status: 'active' });
  const hasReferrer = !!user.referredBy;
  const now = new Date();

  for (const inv of investments) {
    const startDate = new Date(inv.startDate);
    const maxWeeks = inv.maxWeeks || 52;
    const msElapsed = now - startDate;
    const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
    const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
    const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
    const grossEarnings = Math.round(weeklyEarning * activeWeeks * 100) / 100;

    const lastSynced = inv.lastSyncedEarnings || 0;
    const newGross = grossEarnings - lastSynced;

    if (newGross <= 0) continue;

    let forUser = newGross;
    let forReferrer = 0;
    if (hasReferrer) {
      forReferrer = Math.round(newGross * REFERRER_CUT * 100) / 100;
      forUser = Math.round(newGross * (1 - REFERRER_CUT) * 100) / 100;
    }

    // Sync atomique
    const updateResult = await Investment.updateOne(
      { _id: inv._id, lastSyncedEarnings: lastSynced },
      { $set: { lastSyncedEarnings: grossEarnings } }
    );

    if (updateResult.modifiedCount > 0) {
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: forUser, totalBenefits: forUser } }
      );

      if (hasReferrer && forReferrer > 0) {
        await User.updateOne(
          { _id: user.referredBy },
          { $inc: { totalCommissions: forReferrer } }
        );
      }
    }
  }
}

/**
 * Met à jour le weeklyRate de tous les investissements actifs
 * Le nouveau rate = baseRate + nouveau bonus du niveau
 */
async function updateInvestmentRates(userId, newBonus) {
  const investments = await Investment.find({ userId, status: 'active' });
  const now = new Date();

  for (const inv of investments) {
    const newRate = (inv.baseRate || 8) + newBonus;

    // On change le taux mais on doit aussi "reset" le point de départ
    // pour que les gains futurs soient calculés au nouveau taux.
    // 
    // Logique :
    // - Les gains jusqu'à maintenant ont été sync au vieux taux (étape précédente)
    // - On met le nouveau taux
    // - On reset startDate à maintenant et recalcule endDate
    // - lastSyncedEarnings = 0 (on repart de 0 avec le nouveau taux)
    // - Le montant investi et maxWeeks restants sont conservés
    
    const startDate = new Date(inv.startDate);
    const maxWeeks = inv.maxWeeks || 52;
    const msElapsed = now - startDate;
    const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
    const weeksRemaining = Math.max(maxWeeks - weeksElapsed, 0);

    await Investment.updateOne(
      { _id: inv._id },
      {
        $set: {
          weeklyRate: newRate,
          // Reset le calcul pour repartir au nouveau taux
          startDate: now,
          endDate: new Date(now.getTime() + weeksRemaining * 7 * 24 * 60 * 60 * 1000),
          maxWeeks: Math.ceil(weeksRemaining),
          lastSyncedEarnings: 0,
          level: inv.level // garder trace
        }
      }
    );
  }

  return investments.length;
}

/**
 * Fonction principale : level up complet
 * @param {ObjectId} userId - ID de l'utilisateur
 * @returns {Object} - { success, newLevel, rateBonus, investmentsUpdated }
 */
export async function performLevelUp(userId) {
  const user = await User.findById(userId);
  if (!user || user.level >= 20) {
    return { success: false, reason: 'Cannot level up' };
  }

  // 1. Sync tous les gains au taux actuel
  await syncEarningsBeforeRateChange(userId);

  // 2. Level up le user
  const oldLevel = user.level;
  user.levelUp();
  await user.save();

  // 3. Calculer le nouveau bonus
  const newBonus = user.getRateBonus(); // 0 pour level 1, 5 pour level 2, 10 pour level 3+

  // 4. Mettre à jour les taux de tous les investissements actifs
  const updatedCount = await updateInvestmentRates(userId, newBonus);

  console.log(`🚀 ${user.name}: Niveau ${oldLevel} → ${user.level} | Bonus: +${newBonus}% | ${updatedCount} investissements mis à jour`);

  return {
    success: true,
    newLevel: user.level,
    oldLevel,
    rateBonus: newBonus,
    investmentsUpdated: updatedCount
  };
}

export default performLevelUp;