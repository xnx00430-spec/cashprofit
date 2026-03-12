// lib/cron/syncEarnings.js
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';

/**
 * Synchronise les gains live de chaque investissement actif dans user.balance
 * À exécuter toutes les 5-10 minutes (via Vercel Cron, node-cron, etc.)
 * 
 * LOGIQUE SÉCURISÉE (anti double-comptage) :
 * 1. On lit lastSyncedEarnings de chaque investissement
 * 2. On calcule les nouveaux gains (grossEarnings - lastSyncedEarnings)
 * 3. On met à jour lastSyncedEarnings AVEC un filtre atomique pour éviter les races
 * 4. SEULEMENT si le update a réussi, on crédite user.balance
 * 
 * Protection contre :
 * - Exécutions parallèles du cron (grâce au filtre atomique sur lastSyncedEarnings)
 * - Crash entre les deux saves (lastSyncedEarnings est mis à jour en premier)
 * - Re-syncs accumulés
 */

// Verrou simple en mémoire pour empêcher les exécutions parallèles
let isRunning = false;

export async function syncEarnings() {
  // Protection contre les exécutions parallèles
  if (isRunning) {
    console.log('⏸️ Sync déjà en cours, skip');
    return { success: false, reason: 'already_running' };
  }

  isRunning = true;

  try {
    console.log('💰 Synchronisation des gains en cours...');
    
    await connectDB();

    const REFERRER_CUT = 0.10;
    const now = new Date();

    // Récupérer tous les investissements actifs (lean = lecture seule, plus rapide)
    const investments = await Investment.find({ status: 'active' }).lean();

    console.log(`📊 ${investments.length} investissements actifs à synchroniser`);

    let totalSynced = 0;
    let usersUpdated = new Set();
    let commissionsDistributed = 0;

    // Grouper les gains par userId pour faire un seul update par user
    const earningsByUser = {};

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

      // Dernier montant synchronisé
      const lastSynced = inv.lastSyncedEarnings || 0;
      const newGrossEarnings = Math.round((grossEarnings - lastSynced) * 100) / 100;

      if (newGrossEarnings <= 0.01) continue;

      // ============================================================
      // ÉTAPE CRITIQUE : Update atomique de lastSyncedEarnings
      // 
      // Le filtre inclut la VALEUR ACTUELLE de lastSyncedEarnings.
      // Si un autre process a déjà sync cet investissement entre-temps,
      // la valeur aura changé → le filtre ne matchera pas → modifiedCount = 0
      // → on ne crédite pas en double.
      // ============================================================
      const updateResult = await Investment.updateOne(
        { 
          _id: inv._id, 
          lastSyncedEarnings: lastSynced  // Filtre atomique anti-doublon !
        },
        { 
          $set: { lastSyncedEarnings: grossEarnings } 
        }
      );

      // Si modifiedCount === 0, un autre process a déjà sync → on skip
      if (updateResult.modifiedCount === 0) {
        console.log(`   ⏭️ Investment ${inv._id} déjà sync par un autre process`);
        continue;
      }

      // Accumuler les gains par utilisateur
      const userId = inv.userId.toString();
      if (!earningsByUser[userId]) {
        earningsByUser[userId] = {
          odId: inv.userId,
          totalNewGross: 0,
        };
      }
      earningsByUser[userId].totalNewGross += newGrossEarnings;
    }

    // Créditer chaque utilisateur en une seule opération atomique ($inc)
    for (const [userId, data] of Object.entries(earningsByUser)) {
      const user = await User.findById(data.odId).select('referredBy').lean();
      if (!user) continue;

      const hasReferrer = !!user.referredBy;
      let netForUser = data.totalNewGross;
      let forReferrer = 0;

      if (hasReferrer) {
        forReferrer = Math.round(data.totalNewGross * REFERRER_CUT * 100) / 100;
        netForUser = Math.round(data.totalNewGross * (1 - REFERRER_CUT) * 100) / 100;
      }

      // $inc atomique : pas de lecture → modification → écriture
      // Même si deux process tournent, chaque $inc s'ajoute correctement
      await User.updateOne(
        { _id: user._id },
        { 
          $inc: { 
            balance: netForUser,
            totalBenefits: netForUser
          }
        }
      );

      // Créditer le parrain
      if (hasReferrer && forReferrer > 0) {
        await User.updateOne(
          { _id: user.referredBy },
          { $inc: { totalCommissions: forReferrer } }
        );
        commissionsDistributed += forReferrer;
      }

      totalSynced += netForUser;
      usersUpdated.add(userId);
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
  } finally {
    isRunning = false;
  }
}

export default syncEarnings;