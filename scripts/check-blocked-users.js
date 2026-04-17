// scripts/check-blocked-users.js
// À exécuter : node scripts/check-blocked-users.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Définir les schémas directement
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  level: Number,
  balance: Number,
  totalCommissions: Number,
  bonusParrainage: Number,
  benefitsBlocked: Boolean,
  currentLevelDeadline: Date,
  referredBy: mongoose.Schema.Types.ObjectId,
  _id: mongoose.Schema.Types.ObjectId
});

const investmentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
  lastSyncedEarnings: Number,
  _id: mongoose.Schema.Types.ObjectId
});

const User = mongoose.model('User', userSchema);
const Investment = mongoose.model('Investment', investmentSchema);

async function checkBlockedUsers() {
  try {
    console.log('🔍 Connexion à MongoDB...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cashprofit');
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔍 Recherche des users bloqués...\n');

    // Trouver tous les users bloqués
    const blockedUsers = await User.find({ benefitsBlocked: true });

    console.log(`📊 ${blockedUsers.length} utilisateurs bloqués trouvés\n`);
    console.log('='.repeat(100));

    for (const user of blockedUsers) {
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   Niveau: ${user.level}`);
      console.log(`   Bloqué depuis: ${user.currentLevelDeadline?.toLocaleDateString() || 'N/A'}`);
      console.log(`\n   💰 BALANCE ACTUELLE:`);
      console.log(`      - balance (bénéfices): ${(user.balance || 0).toLocaleString()} F`);
      console.log(`      - totalCommissions: ${(user.totalCommissions || 0).toLocaleString()} F`);
      console.log(`      - bonusParrainage: ${(user.bonusParrainage || 0).toLocaleString()} F`);

      // Récupérer ses investissements
      const investments = await Investment.find({
        userId: user._id,
        status: 'active'
      }).lean();

      console.log(`\n   📈 INVESTISSEMENTS ACTIFS: ${investments.length}`);
      
      let totalSyncedEarnings = 0;
      for (const inv of investments) {
        const lastSynced = inv.lastSyncedEarnings || 0;
        totalSyncedEarnings += lastSynced;
        console.log(`      - ${inv.amount.toLocaleString()} F: ${lastSynced.toLocaleString()} F synchronisé`);
      }

      console.log(`\n   ✅ TOTAL DEVRAIT ÊTRE (lastSyncedEarnings):`);
      console.log(`      - balance: ${totalSyncedEarnings.toLocaleString()} F`);
      console.log(`      - totalCommissions: À CALCULER (voir ci-dessous)`);

      // Calculer les commissions qu'il DEVRAIT avoir
      const referrals = await User.find({ referredBy: user._id }).lean();
      console.log(`\n   🔗 FILLEULS: ${referrals.length}`);
      
      let correctCommissions = 0;
      for (const ref of referrals) {
        const refInv = await Investment.find({ userId: ref._id, status: 'active' }).lean();
        let refEarnings = 0;
        for (const inv of refInv) {
          refEarnings += inv.lastSyncedEarnings || 0;
        }
        const commission = refEarnings * 0.10;
        correctCommissions += commission;
        console.log(`      - ${ref.name}: ${refEarnings.toLocaleString()} F → commission: ${commission.toLocaleString()} F`);
      }

      console.log(`\n   📊 CORRECTION À FAIRE:`);
      const balanceDiff = (user.balance || 0) - totalSyncedEarnings;
      const commissionDiff = (user.totalCommissions || 0) - correctCommissions;
      
      if (balanceDiff > 0) {
        console.log(`      ❌ BALANCE: ${balanceDiff.toLocaleString()} F À RETIRER`);
      } else if (balanceDiff < 0) {
        console.log(`      ✅ BALANCE: ${Math.abs(balanceDiff).toLocaleString()} F À AJOUTER`);
      } else {
        console.log(`      ✅ BALANCE: OK (${totalSyncedEarnings.toLocaleString()} F)`);
      }

      if (commissionDiff > 0) {
        console.log(`      ❌ COMMISSION: ${commissionDiff.toLocaleString()} F À RETIRER`);
      } else if (commissionDiff < 0) {
        console.log(`      ✅ COMMISSION: ${Math.abs(commissionDiff).toLocaleString()} F À AJOUTER`);
      } else {
        console.log(`      ✅ COMMISSION: OK (${correctCommissions.toLocaleString()} F)`);
      }

      console.log('\n' + '='.repeat(100));
    }

    console.log('\n✅ Vérification terminée');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkBlockedUsers();