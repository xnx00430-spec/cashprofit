// scripts/fix-balances.js
// ============================================================
// CORRECTION : Remet les balances aux valeurs correctes
// Lance avec : node scripts/fix-balances.js
// Ajoute --dry-run pour simuler sans modifier la DB
// Ajoute --confirm pour appliquer les corrections
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non trouvé');
  process.exit(1);
}

const REFERRER_CUT = 0.10;
const MAX_WEEKS = 52;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isConfirm = args.includes('--confirm');

if (!isDryRun && !isConfirm) {
  console.log('⚠️  Usage :');
  console.log('   node scripts/fix-balances.js --dry-run    → Simule les corrections (aucune modification)');
  console.log('   node scripts/fix-balances.js --confirm    → Applique les corrections en DB');
  console.log('');
  console.log('Lance d\'abord avec --dry-run pour vérifier.');
  process.exit(0);
}

async function fix() {
  console.log(isDryRun ? '🔍 MODE SIMULATION (aucune modification)\n' : '🔧 MODE CORRECTION (modifications en DB)\n');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const investmentsCol = db.collection('investments');

  const users = await usersCol.find({ totalInvested: { $gt: 0 } }).toArray();
  const now = new Date();
  const backup = [];
  let fixedCount = 0;

  for (const user of users) {
    const investments = await investmentsCol.find({ 
      userId: user._id, 
      status: 'active' 
    }).toArray();

    const hasReferrer = !!user.referredBy;

    // Recalculer les gains réels
    let totalGrossEarnings = 0;
    let totalLastSynced = 0;

    for (const inv of investments) {
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || MAX_WEEKS;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
      const grossEarnings = weeklyEarning * activeWeeks;
      const lastSynced = inv.lastSyncedEarnings || 0;

      totalGrossEarnings += grossEarnings;
      totalLastSynced += lastSynced;
    }

    const totalNetEarnings = hasReferrer 
      ? totalGrossEarnings * (1 - REFERRER_CUT) 
      : totalGrossEarnings;

    const totalNetSynced = hasReferrer
      ? totalLastSynced * (1 - REFERRER_CUT)
      : totalLastSynced;

    // Balance correcte = gains nets synchronisés - retraits
    const correctBalance = Math.round(Math.max(totalNetSynced - (user.totalWithdrawn || 0), 0) * 100) / 100;
    
    // totalBenefits correct = total net gagné depuis le début (ne diminue pas avec les retraits)
    const correctTotalBenefits = Math.round(totalNetEarnings * 100) / 100;

    const actualBalance = user.balance || 0;
    const diff = Math.round((actualBalance - correctBalance) * 100) / 100;

    if (Math.abs(diff) > 1) {
      fixedCount++;
      
      // Sauvegarder le backup
      backup.push({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        before: {
          balance: actualBalance,
          totalBenefits: user.totalBenefits || 0
        },
        after: {
          balance: correctBalance,
          totalBenefits: correctTotalBenefits
        },
        diff,
        fixedAt: now.toISOString()
      });

      console.log(`${isDryRun ? '📋' : '🔧'} ${user.name} (${user.email})`);
      console.log(`   balance:       ${actualBalance.toLocaleString()} → ${correctBalance.toLocaleString()} F (${diff > 0 ? '+' : ''}${diff.toLocaleString()} F)`);
      console.log(`   totalBenefits: ${(user.totalBenefits || 0).toLocaleString()} → ${correctTotalBenefits.toLocaleString()} F`);

      if (!isDryRun) {
        await usersCol.updateOne(
          { _id: user._id },
          { 
            $set: { 
              balance: correctBalance,
              totalBenefits: correctTotalBenefits
            } 
          }
        );
        console.log(`   ✅ Corrigé en DB`);
      } else {
        console.log(`   ⏸️  Sera corrigé avec --confirm`);
      }
      console.log('');
    }
  }

  // Sauvegarder le backup dans un fichier
  if (backup.length > 0) {
    const backupPath = path.resolve(__dirname, `../backup-balances-${now.toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup sauvegardé : ${backupPath}`);
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log(`📊 RÉSUMÉ :`);
  console.log(`   Utilisateurs analysés: ${users.length}`);
  console.log(`   Balances à corriger: ${fixedCount}`);
  
  const totalExcess = backup.reduce((sum, b) => sum + Math.max(b.diff, 0), 0);
  const totalDeficit = backup.reduce((sum, b) => sum + Math.min(b.diff, 0), 0);
  
  if (totalExcess > 0) console.log(`   Excès retiré: -${Math.round(totalExcess).toLocaleString()} F`);
  if (totalDeficit < 0) console.log(`   Déficit ajouté: +${Math.round(Math.abs(totalDeficit)).toLocaleString()} F`);
  
  if (isDryRun) {
    console.log(`\n✏️  C'était une simulation. Pour appliquer :`);
    console.log(`   node scripts/fix-balances.js --confirm`);
  } else {
    console.log(`\n✅ ${fixedCount} balance(s) corrigée(s) avec succès !`);
    console.log(`\n⚠️  IMPORTANT : Il faut aussi corriger le cron/sync pour éviter que ça se reproduise.`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Déconnecté');
}

fix().catch(err => {
  console.error('❌ Erreur:', err);
  mongoose.disconnect();
  process.exit(1);
});