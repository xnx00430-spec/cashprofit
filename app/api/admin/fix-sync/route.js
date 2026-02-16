// app/api/admin/fix-sync/route.js
// FIX V3 - Utilise les investissements déjà chargés pour éviter les problèmes de query
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Investment from '@/models/Investment';
import User from '@/models/User';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    await connectDB();
    const now = new Date();

    // ==================== ÉTAPE 1 : Charger TOUS les investissements actifs ====================
    const allInvestments = await Investment.find({ status: 'active' });
    const invLogs = [];

    // Grouper par userId et calculer les gains bruts
    const earningsByUser = {}; // { userIdString: totalGrossEarnings }

    for (const inv of allInvestments) {
      const startDate = new Date(inv.startDate);
      const maxWeeks = inv.maxWeeks || 52;
      const msElapsed = now - startDate;
      const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
      const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
      const weeklyEarning = inv.amount * ((inv.weeklyRate || inv.baseRate || 10) / 100);
      const grossEarnings = Math.round(weeklyEarning * activeWeeks * 100) / 100;

      // Mettre à jour lastSyncedEarnings
      inv.lastSyncedEarnings = grossEarnings;
      await inv.save();

      // Accumuler par user
      const uid = inv.userId.toString();
      if (!earningsByUser[uid]) earningsByUser[uid] = 0;
      earningsByUser[uid] += grossEarnings;

      invLogs.push({
        invId: inv._id.toString().slice(-6),
        userId: uid.slice(-6),
        amount: inv.amount,
        grossEarnings
      });
    }

    // ==================== ÉTAPE 2 : Corriger chaque user ====================
    const users = await User.find({});
    const userLogs = [];

    for (const user of users) {
      const uid = user._id.toString();
      const oldBalance = user.balance || 0;
      const hasReferrer = !!user.referredBy;

      // Gains bruts depuis le map
      const totalGross = earningsByUser[uid] || 0;
      const totalNet = hasReferrer
        ? Math.round(totalGross * 0.90 * 100) / 100
        : totalGross;

      // Retraits de type gains déjà effectués
      const withdrawals = await Withdrawal.aggregate([
        {
          $match: {
            userId: user._id,
            type: 'gains',
            status: { $in: ['pending', 'approved', 'completed'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalWithdrawn = withdrawals[0]?.total || 0;

      // Solde correct = gains nets - retraits
      const correctBalance = Math.round(Math.max(totalNet - totalWithdrawn, 0) * 100) / 100;

      user.balance = correctBalance;

      // Initialiser firstInvestmentAmount pour les users existants
      if (user.totalInvested > 0 && !user.firstInvestmentAmount) {
        // On prend le 1er investissement de l'user (le plus ancien)
        const firstInv = await Investment.findOne({ userId: user._id }).sort({ createdAt: 1 }).lean();
        user.firstInvestmentAmount = firstInv ? firstInv.amount : user.totalInvested;
        // Recalculer le target basé sur le 1er investissement
        user.currentLevelTarget = user.firstInvestmentAmount * 5;
      }

      await user.save();

      userLogs.push({
        userId: uid.slice(-6),
        name: user.name,
        hasReferrer,
        oldBalance,
        totalGross,
        totalNet,
        totalWithdrawn,
        correctBalance
      });
    }

    return NextResponse.json({
      success: true,
      message: `${allInvestments.length} investissements et ${users.length} utilisateurs corrigés`,
      investments: invLogs,
      users: userLogs
    });

  } catch (error) {
    console.error('Fix sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}