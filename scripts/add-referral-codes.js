// scripts/add-referral-codes.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

await mongoose.connect(process.env.MONGODB_URI);

const UserSchema = new mongoose.Schema({
  sponsorCode: String,
  referralCode: String,
  email: String,
  name: String
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function addReferralCodes() {
  console.log('🔄 Ajout des codes de parrainage...\n');

  try {
    // Récupérer tous les users sans referralCode
    const usersWithoutCode = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    console.log(`📊 ${usersWithoutCode.length} utilisateur(s) sans code de parrainage\n`);

    for (const user of usersWithoutCode) {
      // Utiliser sponsorCode s'il existe, sinon en générer un nouveau
      let code = user.sponsorCode;

      if (!code) {
        // Générer un code unique
        let exists = true;
        while (exists) {
          code = Math.random().toString(36).substring(2, 10).toUpperCase();
          exists = await User.findOne({ 
            $or: [
              { sponsorCode: code },
              { referralCode: code }
            ]
          });
        }
        user.sponsorCode = code;
      }

      // Attribuer le code
      user.referralCode = code;
      await user.save();

      console.log(`✅ ${user.email || user.name} → Code: ${code}`);
    }

    console.log('\n🎉 Migration terminée !');

    // Vérification finale
    const totalUsers = await User.countDocuments();
    const usersWithCode = await User.countDocuments({ 
      referralCode: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`\n📊 Résultat final:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users avec code: ${usersWithCode}`);
    console.log(`   Users sans code: ${totalUsers - usersWithCode}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

addReferralCodes();