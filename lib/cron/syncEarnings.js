// lib/cron/syncEarnings.js
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';

let isRunning = false;

export async function syncEarnings() {
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

    const investments = await Investment.find({ status: 'active' }).lean();

    console.log(`📊 ${investments.length} investissements actifs à synchroniser`);

    let totalSynced = 0;
    let usersUpdated = new Set();
    let commissionsDistributed = 0;
    let blockedUsers = 0;

    const earningsByUser = {};

    for (const inv of investments) {
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || 52;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyRate = inv.weeklyRate || inv.baseRate || 10;
      const weeklyEarning = inv.amount * (weeklyRate / 100);
      const grossEarnings = Math.round(weeklyEarning * activeWeeks * 100) / 100;

      const lastSynced = inv.lastSyncedEarnings || 0;
      const newGrossEarnings = Math.round((grossEarnings - lastSynced) * 100) / 100;

      if (newGrossEarnings <= 0.01) continue;

      // ✅ UPDATE ATOMIQUE
      const updateResult = await Investment.updateOne(
        { 
          _id: inv._id, 
          lastSyncedEarnings: lastSynced
        },
        { 
          $set: { lastSyncedEarnings: grossEarnings } 
        }
      );

      if (updateResult.modifiedCount === 0) {
        console.log(`   ⏭️ Investment ${inv._id} déjà sync par un autre process`);
        continue;
      }

      const userId = inv.userId.toString();
      if (!earningsByUser[userId]) {
        earningsByUser[userId] = {
          userId: inv.userId,
          totalNewGross: 0,
        };
      }
      earningsByUser[userId].totalNewGross += newGrossEarnings;
    }

    // ==================== CRÉDITER CHAQUE UTILISATEUR ====================
    for (const [userId, data] of Object.entries(earningsByUser)) {
      // ✅ RÉCUPÉRER L'UTILISATEUR (FILLEUL)
      const user = await User.findById(data.userId);
      if (!user) continue;

      // ❌ SI FILLEUL BLOQUÉ → NE PAS CRÉDITER NI LUI NI SON PARRAIN
      if (user.benefitsBlocked) {
        console.log(`   🚫 ${user.name} - Bénéfices bloqués, gains ARRÊTÉS (figés) - parrain pas crédité`);
        blockedUsers++;
        continue; // ✅ STOP la sync pour cet utilisateur ET son parrain
      }

      const hasReferrer = !!user.referredBy;
      let netForUser = data.totalNewGross;
      let forReferrer = 0;

      if (hasReferrer) {
        forReferrer = Math.round(data.totalNewGross * REFERRER_CUT * 100) / 100;
        netForUser = Math.round(data.totalNewGross * (1 - REFERRER_CUT) * 100) / 100;
      }

      // Créditer l'utilisateur (FILLEUL)
      await User.updateOne(
        { _id: user._id },
        { 
          $inc: { 
            balance: netForUser,
            totalBenefits: netForUser
          }
        }
      );

      // ✅ CRÉDITER LE PARRAIN SEULEMENT SI LE FILLEUL N'EST PAS BLOQUÉ
      if (hasReferrer && forReferrer > 0) {
        // ✅ Le filleul n'est pas bloqué (sinon on serait entré dans le continue au dessus)
        // Donc on peut créditer le parrain
        await User.updateOne(
          { _id: user.referredBy },
          { $inc: { totalCommissions: forReferrer } }
        );
        commissionsDistributed += forReferrer;
        console.log(`      💸 Parrain crédité : +${forReferrer.toLocaleString()} F`);
      }

      totalSynced += netForUser;
      usersUpdated.add(userId);
      console.log(`   ✅ ${user.name} - +${netForUser.toLocaleString()} F synchronisés`);
    }

    console.log(`
✅ Synchronisation terminée :
   - ${usersUpdated.size} utilisateurs avec gains actifs
   - ${blockedUsers} utilisateurs avec gains BLOQUÉS (figés)
   - ${totalSynced.toLocaleString()} F de gains synchronisés
   - ${commissionsDistributed.toLocaleString()} F de commissions distribuées
    `);

    return {
      success: true,
      investmentsProcessed: investments.length,
      usersUpdated: usersUpdated.size,
      blockedUsers,
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