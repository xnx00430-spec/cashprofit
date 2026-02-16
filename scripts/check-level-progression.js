// scripts/check-level-progression.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

await mongoose.connect(process.env.MONGODB_URI);

const UserSchema = new mongoose.Schema({
  level: Number,
  referredBy: mongoose.Schema.Types.ObjectId,
  totalInvested: Number,
  status: String
});

const InvestmentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  status: String,
  createdAt: Date
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Investment = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);

async function checkLevelProgression() {
  console.log('🔄 Vérification progression niveaux...\n');

  try {
    // Récupérer tous les users niveau 1-9
    const users = await User.find({ 
      level: { $gte: 1, $lt: 10 },
      status: { $ne: 'blocked' }
    });

    console.log(`📊 ${users.length} utilisateurs à vérifier\n`);

    let promoted = 0;

    for (const user of users) {
      
      // Trouver 1er investissement actif
      const firstInvestment = await Investment.findOne({ 
        userId: user._id,
        status: 'active'
      }).sort({ createdAt: 1 });

      if (!firstInvestment) {
        continue; // Pas d'investissement actif
      }

      // Calculer semaines depuis 1er investissement
      const now = new Date();
      const weeksPassed = Math.floor(
        (now - firstInvestment.createdAt) / (7 * 24 * 60 * 60 * 1000)
      );

      // Deadline selon niveau : N1 = 4 semaines, autres = 2 semaines
      const deadlineWeeks = user.level === 1 ? 4 : 2;

      // Si deadline pas encore atteinte, passer au suivant
      if (weeksPassed < deadlineWeeks) {
        continue;
      }

      // Compter filleuls actifs
      const referralsCount = await User.countDocuments({
        referredBy: user._id,
        totalInvested: { $gt: 0 }
      });

      // Filleuls requis pour niveau suivant
      const requiredReferrals = (user.level + 1) * 3;

      // Si conditions remplies → PROMOTION !
      if (referralsCount >= requiredReferrals) {
        const oldLevel = user.level;
        user.level = user.level + 1;
        await user.save();

        promoted++;

        console.log(`✅ User ${user._id}`);
        console.log(`   Niveau ${oldLevel} → ${user.level}`);
        console.log(`   Filleuls: ${referralsCount}/${requiredReferrals}`);
        console.log(`   Semaines: ${weeksPassed}/${deadlineWeeks}\n`);

        // TODO: Envoyer notification email/SMS
        // await sendNotification(user, {
        //   title: `🎉 Niveau ${user.level} débloqué !`,
        //   message: `Vos gains sont maintenant débloqués.`
        // });
      } else {
        // Deadline dépassée mais pas assez de filleuls
        console.log(`⚠️ User ${user._id}`);
        console.log(`   Niveau ${user.level} - Gains BLOQUÉS`);
        console.log(`   Filleuls: ${referralsCount}/${requiredReferrals} (manque ${requiredReferrals - referralsCount})`);
        console.log(`   Semaines: ${weeksPassed}/${deadlineWeeks} (deadline dépassée)\n`);
      }
    }

    console.log(`\n🎉 ${promoted} utilisateur(s) promu(s) !`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkLevelProgression();