// lib/cron/checkLevelDeadlines.js
import connectDB from '@/lib/db';
import User from '@/models/User';
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

    // Trouver tous les users avec deadline dépassée et bénéfices non bloqués
    const now = new Date();
    const usersToCheck = await User.find({
      currentLevelDeadline: { $lte: now },
      benefitsBlocked: false,
      totalInvested: { $gt: 0 } // Uniquement ceux qui ont investi
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

      // Vérifier si objectif atteint
      if (current >= target) {
        // ✅ DÉFI RÉUSSI - Passer au niveau suivant
        const oldLevel = user.level;
        user.levelUp();
        
        console.log(`   ✅ Défi réussi ! Passage au niveau ${user.level}`);
        successCount++;

        // 🔔 NOTIFICATION niveau supérieur
        await createNotification(
          user._id,
          NotificationTemplates.levelUp(
            user.level,
            `Félicitations ! Vous avez atteint le niveau ${user.level}. Nouveau bonus : +${user.getRateBonus()}%`
          )
        );

      } else {
        // ❌ DÉFI ÉCHOUÉ - Bloquer bénéfices
        user.failChallenge();
        
        console.log(`   ❌ Défi échoué - Bénéfices bloqués`);
        blockedCount++;

        // 🔔 NOTIFICATION échec
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
      }

      await user.save();
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