// scripts/fix-cagnotte.js
// ============================================================
// Recalcule la cagnotte de chaque utilisateur correctement :
//   cagnotte = propres investissements (sauf le 1er) + investissements affiliés
// Et level up si objectif atteint
// Lance avec : node scripts/fix-cagnotte.js
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

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const investmentsCol = db.collection('investments');

  const users = await usersCol.find({ totalInvested: { $gt: 0 } }).toArray();

  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.email})`);
    console.log('='.repeat(60));

    const firstInvestmentAmount = user.firstInvestmentAmount || 0;
    const target = firstInvestmentAmount * 5;

    console.log(`   Premier investissement: ${firstInvestmentAmount.toLocaleString()} F`);
    console.log(`   Target (×5): ${target.toLocaleString()} F`);

    // 1. Propres investissements (sauf le premier montant)
    const ownInvestments = await investmentsCol.find({ 
      userId: user._id, 
      status: 'active' 
    }).sort({ createdAt: 1 }).toArray();

    let ownTotal = 0;
    let isFirstSkipped = false;
    
    for (const inv of ownInvestments) {
      if (!isFirstSkipped) {
        // Le premier investissement = celui dont le montant correspond à firstInvestmentAmount
        // Ou simplement le tout premier chronologiquement
        console.log(`   [Skip 1er] ${inv.amount.toLocaleString()} F (${new Date(inv.startDate).toLocaleDateString('fr-FR')})`);
        isFirstSkipped = true;
        continue;
      }
      ownTotal += inv.amount;
      console.log(`   [Propre] +${inv.amount.toLocaleString()} F (${new Date(inv.startDate).toLocaleDateString('fr-FR')})`);
    }

    // 2. Investissements des affiliés
    const referrals = await usersCol.find({ referredBy: user._id }).toArray();
    let affiliateTotal = 0;

    for (const ref of referrals) {
      const refInvestments = await investmentsCol.find({ 
        userId: ref._id, 
        status: 'active' 
      }).toArray();
      
      for (const inv of refInvestments) {
        affiliateTotal += inv.amount;
        console.log(`   [Affilié: ${ref.name}] +${inv.amount.toLocaleString()} F (${new Date(inv.startDate).toLocaleDateString('fr-FR')})`);
      }
    }

    const correctCagnotte = ownTotal + affiliateTotal;
    const currentCagnotte = user.currentLevelCagnotte || 0;

    console.log(`\n   Propres (hors 1er): ${ownTotal.toLocaleString()} F`);
    console.log(`   Affiliés: ${affiliateTotal.toLocaleString()} F`);
    console.log(`   ─────────────────────────`);
    console.log(`   Cagnotte correcte: ${correctCagnotte.toLocaleString()} F`);
    console.log(`   Cagnotte en DB: ${currentCagnotte.toLocaleString()} F`);
    console.log(`   Target: ${target.toLocaleString()} F`);

    const updates = {};

    if (Math.abs(correctCagnotte - currentCagnotte) > 1) {
      updates.currentLevelCagnotte = correctCagnotte;
      console.log(`   🔧 Correction cagnotte: ${currentCagnotte.toLocaleString()} → ${correctCagnotte.toLocaleString()} F`);
    }

    // Vérifier si target atteint → level up
    if (correctCagnotte >= target && target > 0 && user.level < 20) {
      const newLevel = Math.min((user.level || 1) + 1, 20);
      updates.level = newLevel;
      updates.currentLevelCagnotte = 0; // Reset pour le prochain niveau
      updates.currentLevelStartDate = new Date();
      updates.currentLevelDeadline = new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000); // 2 semaines
      updates.currentLevelTarget = firstInvestmentAmount * 5; // Même target
      updates.benefitsBlocked = false;

      console.log(`   🎯 OBJECTIF ATTEINT ! ${correctCagnotte.toLocaleString()} ≥ ${target.toLocaleString()}`);
      console.log(`   🚀 Level up: ${user.level} → ${newLevel}`);
    }

    if (Object.keys(updates).length > 0) {
      await usersCol.updateOne({ _id: user._id }, { $set: updates });
      console.log(`   ✅ Mis à jour en DB`);
    } else {
      console.log(`   ✅ Tout est correct`);
    }
  }

  await mongoose.disconnect();
  console.log('\n\n🔌 Déconnecté');
}

fix().catch(err => {
  console.error('❌ Erreur:', err);
  mongoose.disconnect();
  process.exit(1);
});