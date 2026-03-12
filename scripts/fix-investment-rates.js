// scripts/fix-investment-rates.js
// Script de rattrapage : pour les users qui ont déjà level up,
// fige les gains accumulés à l'ancien taux et applique le nouveau taux à partir de maintenant
//
// Usage : node scripts/fix-investment-rates.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI manquant dans .env.local');
  process.exit(1);
}

async function run() {
  console.log('🔌 Connexion à MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté\n');

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Investment = mongoose.models.Investment || mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));

  // Récupérer les users niveau 2+ avec des investissements actifs
  const users = await User.find({ level: { $gte: 2 }, totalInvested: { $gt: 0 } }).lean();
  console.log(`👥 ${users.length} utilisateurs niveau 2+ à corriger\n`);

  const now = new Date();
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const user of users) {
    const level = user.level || 1;
    const bonusRate = level === 1 ? 0 : level === 2 ? 5 : 10;

    const investments = await Investment.find({ userId: user._id, status: 'active' });

    if (investments.length === 0) continue;

    let userUpdated = 0;

    for (const inv of investments) {
      const correctRate = (inv.baseRate || 10) + bonusRate;

      // Si le taux est déjà correct mais lastSyncedEarnings n'a pas été mis à jour
      // OU si le taux n'est pas encore au bon niveau
      if (inv.weeklyRate !== correctRate) {
        // L'investissement est encore à l'ancien taux → calculer les gains à l'ancien taux, figer, appliquer nouveau
        const oldRate = inv.weeklyRate;
        const msElapsed = now - new Date(inv.startDate);
        const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
        const activeWeeks = Math.min(Math.max(weeksElapsed, 0), inv.maxWeeks);
        const oldWeeklyGain = inv.amount * (oldRate / 100);
        const gainsAtOldRate = (inv.lastSyncedEarnings || 0) + (oldWeeklyGain * activeWeeks);

        const remainingWeeks = Math.max(inv.maxWeeks - activeWeeks, 0);

        await Investment.updateOne(
          { _id: inv._id },
          {
            $set: {
              lastSyncedEarnings: gainsAtOldRate,
              weeklyRate: correctRate,
              level: level,
              startDate: now,
              maxWeeks: Math.ceil(remainingWeeks),
              endDate: new Date(now.getTime() + remainingWeeks * 7 * 24 * 60 * 60 * 1000)
            }
          }
        );

        userUpdated++;
        totalUpdated++;
        console.log(`  📈 ${inv._id}: ${oldRate}% → ${correctRate}% | Gains figés: ${gainsAtOldRate.toFixed(2)} F | Remaining: ${remainingWeeks.toFixed(1)} sem`);
      } else if (inv.weeklyRate === correctRate && (!inv.lastSyncedEarnings || inv.lastSyncedEarnings === 0)) {
        // Le taux est correct mais il manque le figeage (déjà mis à jour par l'ancien script)
        // On ne touche pas — les gains depuis startDate sont déjà au bon taux
        totalSkipped++;
      } else {
        totalSkipped++;
      }
    }

    if (userUpdated > 0) {
      console.log(`✅ ${user.name} (Niv.${level}): ${userUpdated}/${investments.length} investissements corrigés`);
    } else {
      console.log(`⏭️  ${user.name} (Niv.${level}): ${investments.length} investissements déjà OK`);
    }
  }

  console.log(`\n==================== RÉSULTAT ====================`);
  console.log(`✅ ${totalUpdated} investissements corrigés (gains figés + nouveau taux)`);
  console.log(`⏭️  ${totalSkipped} investissements déjà corrects`);
  console.log(`==================================================\n`);

  await mongoose.disconnect();
  console.log('🔌 Déconnecté');
}

run().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});