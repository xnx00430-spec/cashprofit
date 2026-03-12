// scripts/apply-level-bonus.js
// ============================================================
// Applique le bonus de niveau aux investissements existants
// Sync les gains au vieux taux, puis met à jour au nouveau taux
// Lance avec : node scripts/apply-level-bonus.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI non trouvé'); process.exit(1); }

const REFERRER_CUT = 0.10;

async function apply() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const investmentsCol = db.collection('investments');

  // Trouver les users de niveau 2+ dont les investissements n'ont pas encore le bon taux
  const users = await usersCol.find({ 
    level: { $gte: 2 }, 
    totalInvested: { $gt: 0 } 
  }).toArray();

  for (const user of users) {
    console.log(`\n👤 ${user.name} — Niveau ${user.level}`);
    console.log('='.repeat(60));

    // Calculer le bonus attendu
    let expectedBonus = 0;
    if (user.level === 2) expectedBonus = 5;
    else if (user.level >= 3) expectedBonus = 10;

    const investments = await investmentsCol.find({ 
      userId: user._id, 
      status: 'active' 
    }).toArray();

    const hasReferrer = !!user.referredBy;
    const now = new Date();
    let totalSynced = 0;
    let updatedCount = 0;

    for (const inv of investments) {
      const expectedRate = (inv.baseRate || 8) + expectedBonus;
      const currentRate = inv.weeklyRate || inv.baseRate || 8;

      if (currentRate === expectedRate) {
        console.log(`   ✅ ${inv.amount.toLocaleString()} F — déjà à ${currentRate}%`);
        continue;
      }

      console.log(`   🔧 ${inv.amount.toLocaleString()} F — ${currentRate}% → ${expectedRate}% (+${expectedBonus}% bonus)`);

      // 1. Sync les gains au vieux taux
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || 52;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyEarning = inv.amount * (currentRate / 100);
      const grossEarnings = Math.round(weeklyEarning * activeWeeks * 100) / 100;
      const lastSynced = inv.lastSyncedEarnings || 0;
      const newGross = Math.round((grossEarnings - lastSynced) * 100) / 100;

      if (newGross > 0) {
        let forUser = newGross;
        let forReferrer = 0;
        if (hasReferrer) {
          forReferrer = Math.round(newGross * REFERRER_CUT * 100) / 100;
          forUser = Math.round(newGross * (1 - REFERRER_CUT) * 100) / 100;
        }

        // Sync les gains au vieux taux
        await usersCol.updateOne(
          { _id: user._id },
          { $inc: { balance: forUser, totalBenefits: forUser } }
        );
        
        if (hasReferrer && forReferrer > 0) {
          await usersCol.updateOne(
            { _id: user.referredBy },
            { $inc: { totalCommissions: forReferrer } }
          );
        }

        totalSynced += forUser;
        console.log(`      Gains sync au vieux taux: +${forUser.toLocaleString()} F`);
      }

      // 2. Reset et appliquer le nouveau taux
      const weeksRemaining = Math.max(maxWeeks - weeksElapsed, 0);

      await investmentsCol.updateOne(
        { _id: inv._id },
        {
          $set: {
            weeklyRate: expectedRate,
            startDate: now,
            endDate: new Date(now.getTime() + weeksRemaining * 7 * 24 * 60 * 60 * 1000),
            maxWeeks: Math.ceil(weeksRemaining),
            lastSyncedEarnings: 0
          }
        }
      );

      updatedCount++;
    }

    console.log(`\n   📊 Résumé:`);
    console.log(`   Investissements mis à jour: ${updatedCount}`);
    console.log(`   Gains sync avant changement: ${totalSynced.toLocaleString()} F`);
    console.log(`   Nouveau taux: baseRate + ${expectedBonus}%`);
  }

  await mongoose.disconnect();
  console.log('\n\n🔌 Déconnecté');
}

apply().catch(err => {
  console.error('❌ Erreur:', err);
  mongoose.disconnect();
  process.exit(1);
});