// scripts/fix-withdrawn-and-cagnotte.js
// ============================================================
// Corrige totalWithdrawn (enlève les retraits rejetés)
// Diagnostique les problèmes de cagnotte/niveau
// Lance avec : node scripts/fix-withdrawn-and-cagnotte.js
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
  const withdrawalsCol = db.collection('withdrawals');
  const investmentsCol = db.collection('investments');

  const users = await usersCol.find({ totalInvested: { $gt: 0 } }).toArray();

  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.email})`);
    console.log('='.repeat(60));

    // ==================== FIX 1: totalWithdrawn ====================
    // Calculer le vrai totalWithdrawn : seulement les retraits approved/completed
    const validWithdrawals = await withdrawalsCol.find({
      userId: user._id,
      status: { $in: ['approved', 'completed'] }
    }).toArray();

    const correctWithdrawn = validWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const currentWithdrawn = user.totalWithdrawn || 0;

    console.log(`\n📊 RETRAITS:`);
    console.log(`   totalWithdrawn en DB:  ${currentWithdrawn.toLocaleString()} F`);
    console.log(`   Retraits réels (approved/completed): ${correctWithdrawn.toLocaleString()} F`);

    if (Math.abs(currentWithdrawn - correctWithdrawn) > 1) {
      console.log(`   🔧 Correction: ${currentWithdrawn.toLocaleString()} → ${correctWithdrawn.toLocaleString()} F`);
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { totalWithdrawn: correctWithdrawn } }
      );
      console.log(`   ✅ totalWithdrawn corrigé`);
    } else {
      console.log(`   ✅ OK`);
    }

    // ==================== DIAGNOSTIC 2: Cagnotte / Niveau ====================
    console.log(`\n📊 NIVEAU & CAGNOTTE:`);
    console.log(`   Niveau actuel: ${user.level}`);
    console.log(`   firstInvestmentAmount: ${(user.firstInvestmentAmount || 0).toLocaleString()} F`);
    console.log(`   totalInvested: ${(user.totalInvested || 0).toLocaleString()} F`);
    console.log(`   currentLevelCagnotte: ${(user.currentLevelCagnotte || 0).toLocaleString()} F`);
    console.log(`   currentLevelTarget: ${(user.currentLevelTarget || 0).toLocaleString()} F`);
    console.log(`   benefitsBlocked: ${user.benefitsBlocked}`);
    
    if (user.currentLevelDeadline) {
      const deadline = new Date(user.currentLevelDeadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      console.log(`   Deadline: ${deadline.toLocaleDateString('fr-FR')} (${daysLeft > 0 ? daysLeft + ' jours restants' : 'DÉPASSÉE'})`);
    }

    // Vérifier les investissements des affiliés
    const referrals = await usersCol.find({ referredBy: user._id }).toArray();
    console.log(`\n   👥 Affiliés: ${referrals.length}`);
    
    let totalAffiliateInvested = 0;
    for (const ref of referrals) {
      const refInvestments = await investmentsCol.find({ 
        userId: ref._id, 
        status: 'active' 
      }).toArray();
      const refTotal = refInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      totalAffiliateInvested += refTotal;
      if (refTotal > 0) {
        console.log(`      - ${ref.name}: ${refTotal.toLocaleString()} F investi`);
      }
    }
    
    console.log(`   Total investi par affiliés: ${totalAffiliateInvested.toLocaleString()} F`);
    console.log(`   Cagnotte en DB: ${(user.currentLevelCagnotte || 0).toLocaleString()} F`);

    if (totalAffiliateInvested !== (user.currentLevelCagnotte || 0)) {
      console.log(`   ⚠️ DÉCALAGE : cagnotte devrait être ${totalAffiliateInvested.toLocaleString()} F`);
    }

    // Vérifier si devrait level up
    if ((user.currentLevelCagnotte || 0) >= (user.currentLevelTarget || 0) && (user.currentLevelTarget || 0) > 0) {
      console.log(`   🎯 OBJECTIF ATTEINT ! Devrait passer au niveau ${user.level + 1}`);
    }

    // Vérifier le target
    const expectedTarget = (user.firstInvestmentAmount || user.totalInvested) * 5;
    if (expectedTarget !== (user.currentLevelTarget || 0)) {
      console.log(`   ⚠️ Target en DB: ${(user.currentLevelTarget || 0).toLocaleString()} F, attendu: ${expectedTarget.toLocaleString()} F`);
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