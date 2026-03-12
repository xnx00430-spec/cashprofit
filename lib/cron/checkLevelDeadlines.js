// lib/cron/checkLevelDeadlines.js
import connectDB from '@/lib/db';
import User from '@/models/User';
import { performLevelUp } from '@/lib/levelUp';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

/**
 * Vérifie tous les jours les deadlines de défi
 * Bloque les bénéfices si objectif non atteint
 * À exécuter quotidiennement (ex: via Vercel Cron ou node-cron)
 */
export async function checkLevelDeadlines() {
  try {
    console.log('🔍 Vérification des deadlines de défi...');
    
    await connectDB();

    const now = new Date();
    const usersToCheck = await User.find({
      currentLevelDeadline: { $lte: now },
      benefitsBlocked: false,
      totalInvested: { $gt: 0 }
    });

    console.log(`📊 ${usersToCheck.length} utilisateurs à vérifier`);

    let blockedCount = 0;
    let successCount = 0;

    for (const user of usersToCheck) {
      const target = user.currentLevelTarget;
      const current = user.currentLevelCagnotte;

      console.log(`
👤 ${user.name}
   Niveau: ${user.level}
   Cagnotte: ${current.toLocaleString()} F
   Objectif: ${target.toLocaleString()} F
   Deadline: ${user.currentLevelDeadline.toLocaleDateString()}
      `);

      if (current >= target) {
        // ✅ DÉFI RÉUSSI — Level up avec mise à jour des taux
        const result = await performLevelUp(user._id);
        
        if (result.success) {
          console.log(`   ✅ Défi réussi ! Passage au niveau ${result.newLevel} (+${result.rateBonus}% bonus)`);
          console.log(`   📈 ${result.investmentsUpdated} investissement(s) mis à jour au nouveau taux`);
          successCount++;

          // 🔔 Notification
          try {
            await createNotification(
              user._id,
              NotificationTemplates.levelUp(
                result.newLevel,
                `Félicitations ! Vous avez atteint le niveau ${result.newLevel}. Nouveau bonus : +${result.rateBonus}% sur tous vos investissements !`
              )
            );
          } catch (e) { console.error('Notif error:', e); }
        }

      } else {
        // ❌ DÉFI ÉCHOUÉ — Bloquer bénéfices
        user.failChallenge();
        await user.save();
        
        console.log(`   ❌ Défi échoué - Bénéfices bloqués`);
        blockedCount++;

        // 🔔 Notification
        try {
          await createNotification(
            user._id,
            {
              type: 'challenge_failed',
              title: '❌ Défi non atteint',
              message: `Objectif : ${target.toLocaleString()} FCFA - Atteint : ${current.toLocaleString()} FCFA. Vos bénéfices personnels sont bloqués. Vos commissions restent accessibles.`,
              data: {
                level: user.level,
                target,
                current,
                missing: target - current
              }
            }
          );
        } catch (e) { console.error('Notif error:', e); }
      }
    }

    console.log(`
✅ Vérification terminée :
   - ${successCount} utilisateurs passés au niveau supérieur
   - ${blockedCount} utilisateurs avec bénéfices bloqués
    `);

    return {
      success: true,
      checked: usersToCheck.length,
      leveledUp: successCount,
      blocked: blockedCount
    };

  } catch (error) {
    console.error('❌ Erreur vérification deadlines:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default checkLevelDeadlines;