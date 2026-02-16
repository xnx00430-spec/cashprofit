const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=#]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const MONGODB_URI = envVars.MONGODB_URI;
console.log('URI:', MONGODB_URI ? MONGODB_URI.substring(0, 30) + '...' : 'NON TROUVEE');

async function fixInvestments() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connecte a MongoDB');
    const db = client.db();
    const investments = db.collection('investments');
    const users = db.collection('users');

    console.log('\nCorrection des investissements...');
    const allInvestments = await investments.find({}).toArray();
    console.log(allInvestments.length + ' investissement(s) trouve(s)');
    let updatedCount = 0;

    for (const inv of allInvestments) {
      const updates = {};
      if (inv.maxWeeks !== 52) updates.maxWeeks = 52;
      const startDate = new Date(inv.startDate);
      const correctEndDate = new Date(startDate.getTime() + 52 * 7 * 24 * 60 * 60 * 1000);
      if (inv.endDate.getTime() !== correctEndDate.getTime()) updates.endDate = correctEndDate;
      const user = await users.findOne({ _id: inv.userId });
      if (user) {
        const level = user.level || 1;
        const bonus = level === 1 ? 0 : level === 2 ? 5 : 10;
        const correctRate = inv.baseRate + bonus;
        if (inv.weeklyRate !== correctRate) updates.weeklyRate = correctRate;
      }
      if (Object.keys(updates).length > 0) {
        await investments.updateOne({ _id: inv._id }, { $set: updates });
        updatedCount++;
        console.log('  Investment ' + inv._id + ': ' + JSON.stringify(updates));
      }
    }
    console.log(updatedCount + ' investissement(s) corrige(s)');

    console.log('\nCorrection des users...');
    const allUsers = await users.find({ totalInvested: { $gt: 0 } }).toArray();
    console.log(allUsers.length + ' utilisateur(s) avec investissements');
    let userUpdated = 0;

    for (const user of allUsers) {
      const updates = {};
      const correctTarget = user.totalInvested * 5;
      if (user.currentLevelTarget !== correctTarget) updates.currentLevelTarget = correctTarget;
      if (!user.currentLevelStartDate && user.totalInvested > 0) {
        const firstInv = await investments.findOne({ userId: user._id }, { sort: { createdAt: 1 } });
        if (firstInv) {
          const weeks = (user.level || 1) === 1 ? 3 : 2;
          updates.currentLevelStartDate = firstInv.createdAt;
          updates.currentLevelDeadline = new Date(firstInv.createdAt.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
          updates.currentLevelCagnotte = user.currentLevelCagnotte || 0;
        }
      }
      if (Object.keys(updates).length > 0) {
        await users.updateOne({ _id: user._id }, { $set: updates });
        userUpdated++;
        console.log('  User ' + user.name + ': ' + JSON.stringify(updates));
      }
    }
    console.log(userUpdated + ' utilisateur(s) corrige(s)');
    console.log('\nMigration terminee !');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.close();
    console.log('Deconnecte de MongoDB');
  }
}

fixInvestments();