// lib/cron/syncEarnings.js
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';

/**
 * Synchronise les gains live de chaque investissement actif dans user.balance
 * À exécuter toutes les 5-10 minutes (via Vercel Cron, node-cron, etc.)
 * 
 * Logique :
 * - Calcule les gains totaux de chaque investissement actif
 * - Stocke le dernier montant synchronisé dans investment.lastSyncedEarnings
 * - Ajoute seulement la DIFFÉRENCE (nouveaux gains) à user.balance
 * - Si l'user a un parrain → prélève 10% pour le parrain
 */
export async function syncEarnings() {
  try {
    console.log('💰 Synchronisation des gains en cours...');
    
    await connectDB();

    const REFERRER_CUT = 0.10;
    const now = new Date();

    // Récupérer tous les investissements actifs
    const investments = await Investment.find({ status: 'active' });

    console.log(`📊 ${investments.length} investissements actifs à synchroniser`);

    let totalSynced = 0;
    let usersUpdated = new Set();
    let commissionsDistributed = 0;

    for (const inv of investments) {
      // Calculer les gains bruts totaux depuis le début
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || 52;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyRate = inv.weeklyRate || inv.baseRate || 10;
      const weeklyEarning = inv.amount * (weeklyRate / 100);
      const grossEarnings = Math.round(weeklyEarning * activeWeeks * 100) / 100;

      // Dernier montant synchronisé (pour ne pas re-créditer)
      const lastSynced = inv.lastSyncedEarnings || 0;
      const newEarnings = grossEarnings - lastSynced;

      if (newEarnings <= 0) continue; // Pas de nouveaux gains

      // Récupérer l'investisseur
      const user = await User.findById(inv.userId);
      if (!user) continue;

      const hasReferrer = !!user.referredBy;

      // Calculer la part nette pour l'investisseur
      let netForUser = newEarnings;
      let forReferrer = 0;

      if (hasReferrer) {
        forReferrer = Math.round(newEarnings * REFERRER_CUT * 100) / 100;
        netForUser = Math.round(newEarnings * (1 - REFERRER_CUT) * 100) / 100;
      }

      // Créditer l'investisseur
      user.balance = Math.round(((user.balance || 0) + netForUser) * 100) / 100;
      user.totalBenefits = Math.round(((user.totalBenefits || 0) + netForUser) * 100) / 100;
      await user.save();

      // Créditer le parrain (commission)
      if (hasReferrer && forReferrer > 0) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          referrer.totalCommissions = Math.round(((referrer.totalCommissions || 0) + forReferrer) * 100) / 100;
          await referrer.save();
          commissionsDistributed += forReferrer;
        }
      }

      // Mettre à jour le dernier montant synchronisé
      inv.lastSyncedEarnings = grossEarnings;
      await inv.save();

      totalSynced += netForUser;
      usersUpdated.add(inv.userId.toString());
    }

    console.log(`
✅ Synchronisation terminée :
   - ${usersUpdated.size} utilisateurs mis à jour
   - ${totalSynced.toLocaleString()} F de gains synchronisés
   - ${commissionsDistributed.toLocaleString()} F de commissions distribuées
    `);

    return {
      success: true,
      investmentsProcessed: investments.length,
      usersUpdated: usersUpdated.size,
      totalSynced,
      commissionsDistributed
    };

  } catch (error) {
    console.error('❌ Erreur sync gains:', error);
    return { success: false, error: error.message };
  }
}

export default syncEarnings;