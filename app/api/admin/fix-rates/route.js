// app/api/admin/fix-rates/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Investment from '@/models/Investment';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    await connectDB();

    // Trouver tous les investissements avec weeklyRate suspect (< baseRate)
    const investments = await Investment.find({ status: 'active' });
    const fixes = [];

    for (const inv of investments) {
      const user = await User.findById(inv.userId).select('level');
      const level = user?.level || inv.level || 1;
      const bonusRate = level === 1 ? 0 : level === 2 ? 5 : 10;
      const correctRate = inv.baseRate + bonusRate;

      if (inv.weeklyRate !== correctRate) {
        const oldRate = inv.weeklyRate;
        inv.weeklyRate = correctRate;
        // Reset lastSyncedEarnings pour recalculer
        inv.lastSyncedEarnings = 0;
        await inv.save();

        fixes.push({
          investmentId: inv._id.toString().slice(-6),
          userId: inv.userId.toString().slice(-6),
          amount: inv.amount,
          baseRate: inv.baseRate,
          level,
          bonusRate,
          oldWeeklyRate: oldRate,
          newWeeklyRate: correctRate
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${fixes.length} investissements corrigés sur ${investments.length} total`,
      fixes,
      nextStep: 'Lancez maintenant /api/admin/fix-sync pour recalculer les balances'
    });

  } catch (error) {
    console.error('Fix rates error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}