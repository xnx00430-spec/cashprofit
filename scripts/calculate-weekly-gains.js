import connectDB from '../lib/db.js';
import Investment from '../models/Investment.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';

async function calculateWeeklyGains() {
  await connectDB();
  
  console.log('🔄 Calcul des gains hebdomadaires...');
  
  const investments = await Investment.find({ status: 'active' });
  
  for (const inv of investments) {
    const now = new Date();
    const weeksPassed = Math.floor((now - inv.startDate) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeksPassed > (inv.lastProcessedWeek || 0)) {
      const weeklyGain = inv.amount * (inv.weeklyRate / 100);
      
      await User.findByIdAndUpdate(inv.userId, {
        $inc: { balance: weeklyGain, totalEarnings: weeklyGain }
      });
      
      inv.lastProcessedWeek = weeksPassed;
      await inv.save();
      
      console.log(`✅ ${weeklyGain} FCFA pour user ${inv.userId}`);
    }
  }
  
  console.log('✅ Terminé !');
  process.exit(0);
}

calculateWeeklyGains();