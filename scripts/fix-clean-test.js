// scripts/fix-clean-test.js
// Script de nettoyage complet pour le compte test
// Remet tout proprement : niveau 1, taux de base, pas de gains figés
//
// Usage : node scripts/fix-clean-test.js

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

  // ==================== ÉTAPE 1 : Lister les users touchés ====================
  const usersWithSynced = await Investment.distinct('userId', { 
    lastSyncedEarnings: { $gt: 0 } 
  });

  const users = await User.find({ _id: { $in: usersWithSynced } }).lean();
  
  if (users.length === 0) {
    // Si pas de lastSyncedEarnings > 0, chercher les users niveau 2+ 
    const lvlUsers = await User.find({ level: { $gte: 2 }, totalInvested: { $gt: 0 } }).lean();
    if (lvlUsers.length === 0) {
      console.log('Aucun user à corriger.');
      await mongoose.disconnect();
      return;
    }
    users.push(...lvlUsers);
  }

  console.log(`👥 ${users.length} utilisateur(s) à nettoyer:\n`);

  for (const user of users) {
    console.log(`\n========== ${user.name} (${user.email}) ==========`);
    console.log(`Niveau actuel: ${user.level}`);

    const investments = await Investment.find({ userId: user._id, status: 'active' });
    console.log(`Investissements actifs: ${investments.length}`);

    for (const inv of investments) {
      const baseRate = inv.baseRate || 10;
      const oldRate = inv.weeklyRate;
      const oldSynced = inv.lastSyncedEarnings || 0;
      const originalStartDate = inv.createdAt || inv.startDate; // createdAt = date de création originale
      const maxWeeks = 52; // remettre à 52 semaines

      // Remettre au taux de base (niveau 1 = pas de bonus)
      const newRate = baseRate;

      // Calculer la bonne endDate depuis la date de création originale
      const start = new Date(originalStartDate);
      const endDate = new Date(start.getTime() + maxWeeks * 7 * 24 * 60 * 60 * 1000);

      await Investment.updateOne(
        { _id: inv._id },
        {
          $set: {
            weeklyRate: newRate,
            level: 1,
            lastSyncedEarnings: 0,
            startDate: start,
            maxWeeks: maxWeeks,
            endDate: endDate
          }
        }
      );

      console.log(`  📦 ${inv._id}:`);
      console.log(`     Montant: ${inv.amount?.toLocaleString()} F`);
      console.log(`     Taux: ${oldRate}% → ${newRate}% (base sans bonus)`);
      console.log(`     lastSyncedEarnings: ${oldSynced.toFixed(2)} → 0`);
      console.log(`     startDate: remis à ${start.toLocaleDateString('fr-FR')}`);
      console.log(`     maxWeeks: remis à ${maxWeeks}`);
    }

    // Remettre le user au niveau 1
    const firstInvestment = investments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    const firstAmount = firstInvestment?.amount || user.firstInvestmentAmount || 100000;

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          level: 1,
          benefitsBlocked: false,
          currentLevelStartDate: new Date(),
          currentLevelDeadline: new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000), // 3 semaines
          currentLevelTarget: firstAmount * 5,
          currentLevelCagnotte: 0,
          firstInvestmentAmount: firstAmount
        }
      }
    );

    // Recalculer la cagnotte : tous les investissements sauf le premier
    const allInvestments = investments
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let cagnotte = 0;
    for (let i = 1; i < allInvestments.length; i++) { // commence à 1, skip le premier
      cagnotte += allInvestments[i].amount;
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { currentLevelCagnotte: cagnotte } }
    );

    console.log(`\n  👤 User remis au niveau 1`);
    console.log(`     Target: ${(firstAmount * 5).toLocaleString()} F`);
    console.log(`     Cagnotte recalculée: ${cagnotte.toLocaleString()} F (${allInvestments.length - 1} investissements après le 1er)`);
    
    if (cagnotte >= firstAmount * 5) {
      console.log(`     ⚠️  La cagnotte dépasse déjà le target ! Le level up se fera au prochain investissement.`);
    } else {
      console.log(`     Il manque: ${((firstAmount * 5) - cagnotte).toLocaleString()} F pour niveau 2`);
    }
  }

  console.log(`\n==================== TERMINÉ ====================`);
  console.log(`Tous les users ont été remis au niveau 1 avec les taux de base.`);
  console.log(`Les cagnottes ont été recalculées.`);
  console.log(`Au prochain investissement, si la cagnotte >= target, le level up`);
  console.log(`se fera proprement avec le figeage des gains.`);
  console.log(`==================================================\n`);

  await mongoose.disconnect();
  console.log('🔌 Déconnecté');
}

run().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});