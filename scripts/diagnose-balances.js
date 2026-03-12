// scripts/diagnose-balances.js
// ============================================================
// DIAGNOSTIC : Détecte les balances corrompues
// Lance avec : node scripts/diagnose-balances.js
// (depuis la racine de ton projet Next.js)
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env depuis la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Aussi essayer .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non trouvé dans .env ou .env.local');
  process.exit(1);
}

const REFERRER_CUT = 0.10;
const MAX_WEEKS = 52;

async function diagnose() {
  console.log('🔍 Connexion à MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const investmentsCol = db.collection('investments');

  // Récupérer tous les users qui ont investi
  const users = await usersCol.find({ totalInvested: { $gt: 0 } }).toArray();
  console.log(`📊 ${users.length} utilisateur(s) avec des investissements\n`);
  console.log('='.repeat(90));

  let corruptCount = 0;
  const results = [];

  for (const user of users) {
    const investments = await investmentsCol.find({ 
      userId: user._id, 
      status: 'active' 
    }).toArray();

    const hasReferrer = !!user.referredBy;
    const now = new Date();

    // Recalculer les gains réels depuis les investissements
    let totalGrossEarnings = 0;
    let totalLastSynced = 0;
    let totalUnsyncedCalc = 0;

    for (const inv of investments) {
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || MAX_WEEKS;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
      const grossEarnings = weeklyEarning * activeWeeks;
      const lastSynced = inv.lastSyncedEarnings || 0;
      const unsyncedGross = Math.max(grossEarnings - lastSynced, 0);

      totalGrossEarnings += grossEarnings;
      totalLastSynced += lastSynced;
      totalUnsyncedCalc += unsyncedGross;
    }

    // Gains nets (après commission parrain si applicable)
    const totalNetEarnings = hasReferrer 
      ? totalGrossEarnings * (1 - REFERRER_CUT) 
      : totalGrossEarnings;

    const totalNetUnsynced = hasReferrer
      ? totalUnsyncedCalc * (1 - REFERRER_CUT)
      : totalUnsyncedCalc;

    // Ce que user.balance DEVRAIT être :
    // = gains nets déjà sync - montant déjà retiré
    // Normalement : balance = totalNetEarnings - totalNetUnsynced - totalWithdrawn
    // Car: totalNetSynced = totalNetEarnings - totalNetUnsynced
    //      balance = totalNetSynced - totalWithdrawn
    const totalNetSynced = totalNetEarnings - totalNetUnsynced;
    const expectedBalance = Math.max(totalNetSynced - (user.totalWithdrawn || 0), 0);
    
    const actualBalance = user.balance || 0;
    const diff = actualBalance - expectedBalance;
    const diffPercent = expectedBalance > 0 ? ((diff / expectedBalance) * 100).toFixed(1) : 'N/A';
    const isCorrupt = Math.abs(diff) > 10; // tolérance de 10 FCFA

    if (isCorrupt) corruptCount++;

    const status = isCorrupt 
      ? (diff > 0 ? '🔴 TROP ÉLEVÉ' : '🟡 TROP BAS') 
      : '✅ OK';

    results.push({
      name: user.name,
      email: user.email,
      status,
      actualBalance: Math.round(actualBalance * 100) / 100,
      expectedBalance: Math.round(expectedBalance * 100) / 100,
      diff: Math.round(diff * 100) / 100,
      diffPercent,
      totalInvested: user.totalInvested,
      totalWithdrawn: user.totalWithdrawn || 0,
      totalCommissions: user.totalCommissions || 0,
      bonusParrainage: user.bonusParrainage || 0,
      hasReferrer,
      investmentCount: investments.length,
      totalGrossEarnings: Math.round(totalGrossEarnings * 100) / 100,
      totalNetEarnings: Math.round(totalNetEarnings * 100) / 100,
      totalLastSynced: Math.round(totalLastSynced * 100) / 100,
      totalNetUnsynced: Math.round(totalNetUnsynced * 100) / 100,
    });
  }

  // Afficher les résultats
  console.log('\n📋 RÉSULTATS DU DIAGNOSTIC\n');
  
  for (const r of results) {
    console.log(`${r.status} ${r.name} (${r.email})`);
    console.log(`   Investissements: ${r.investmentCount} | Capital: ${r.totalInvested.toLocaleString()} F`);
    console.log(`   Parrain: ${r.hasReferrer ? 'Oui (10% coupé)' : 'Non'}`);
    console.log(`   Gains bruts calculés:  ${r.totalGrossEarnings.toLocaleString()} F`);
    console.log(`   Gains nets calculés:   ${r.totalNetEarnings.toLocaleString()} F`);
    console.log(`   Total lastSyncedEarnings: ${r.totalLastSynced.toLocaleString()} F`);
    console.log(`   Gains non-sync (live):    ${r.totalNetUnsynced.toLocaleString()} F`);
    console.log(`   Retraits effectués:    ${r.totalWithdrawn.toLocaleString()} F`);
    console.log(`   ─────────────────────────────`);
    console.log(`   Balance en DB:         ${r.actualBalance.toLocaleString()} F`);
    console.log(`   Balance attendue:      ${r.expectedBalance.toLocaleString()} F`);
    console.log(`   Différence:            ${r.diff > 0 ? '+' : ''}${r.diff.toLocaleString()} F (${r.diffPercent}%)`);
    console.log('');
  }

  // Résumé
  console.log('='.repeat(90));
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   Total utilisateurs analysés: ${results.length}`);
  console.log(`   ✅ Balances correctes: ${results.length - corruptCount}`);
  console.log(`   🔴 Balances corrompues: ${corruptCount}`);
  
  if (corruptCount > 0) {
    const totalExcess = results
      .filter(r => r.diff > 10)
      .reduce((sum, r) => sum + r.diff, 0);
    const totalDeficit = results
      .filter(r => r.diff < -10)
      .reduce((sum, r) => sum + r.diff, 0);
    
    console.log(`   💰 Excès total (trop dans balance): +${Math.round(totalExcess).toLocaleString()} F`);
    if (totalDeficit < 0) {
      console.log(`   📉 Déficit total (manque dans balance): ${Math.round(totalDeficit).toLocaleString()} F`);
    }
    console.log(`\n⚠️  Pour corriger, lance: node scripts/fix-balances.js`);
  } else {
    console.log(`\n🎉 Toutes les balances sont correctes !`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Déconnecté de MongoDB');
}

diagnose().catch(err => {
  console.error('❌ Erreur:', err);
  mongoose.disconnect();
  process.exit(1);
});