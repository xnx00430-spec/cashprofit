// app/api/user/withdraw/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Withdrawal from '@/models/Withdrawal';
import { verifyAuth } from '@/lib/auth';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

// ==================== CALCUL GAINS LIVE ====================
function calculateLiveEarnings(investments, hasReferrer = false) {
  const REFERRER_CUT = 0.10;
  const now = new Date();
  let total = 0;

  for (const inv of investments) {
    if (inv.status !== 'active') continue;
    const startDate = new Date(inv.startDate);
    const maxWeeks = inv.maxWeeks || 52;
    const msElapsed = now - startDate;
    const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
    const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
    const weeklyEarning = inv.amount * ((inv.weeklyRate || inv.baseRate || 10) / 100);
    total += weeklyEarning * activeWeeks;
  }

  if (hasReferrer) {
    total = total * (1 - REFERRER_CUT);
  }

  return Math.round(total * 100) / 100;
}

// ==================== SYNC : créditer les gains live en DB ====================
// Appelé juste avant le retrait pour synchroniser les gains
async function syncUserEarnings(user) {
  const investments = await Investment.find({
    userId: user._id,
    status: 'active'
  });

  const hasReferrer = !!user.referredBy;
  const now = new Date();
  let totalNewForUser = 0;
  let totalNewForReferrer = 0;

  for (const inv of investments) {
    const startDate = new Date(inv.startDate);
    const maxWeeks = inv.maxWeeks || 52;
    const msElapsed = now - startDate;
    const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
    const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
    const weeklyEarning = inv.amount * ((inv.weeklyRate || inv.baseRate || 10) / 100);
    const grossEarnings = Math.round(weeklyEarning * activeWeeks * 100) / 100;

    // Dernier montant déjà synchronisé
    const lastSynced = inv.lastSyncedEarnings || 0;
    const newGross = grossEarnings - lastSynced;

    if (newGross <= 0) continue;

    // Répartition
    let forUser = newGross;
    let forReferrer = 0;
    if (hasReferrer) {
      forReferrer = Math.round(newGross * 0.10 * 100) / 100;
      forUser = Math.round(newGross * 0.90 * 100) / 100;
    }

    totalNewForUser += forUser;
    totalNewForReferrer += forReferrer;

    // Mettre à jour le marqueur de sync
    inv.lastSyncedEarnings = grossEarnings;
    await inv.save();
  }

  // Créditer l'utilisateur
  if (totalNewForUser > 0) {
    user.balance = Math.round(((user.balance || 0) + totalNewForUser) * 100) / 100;
  }

  // Créditer le parrain
  if (totalNewForReferrer > 0 && user.referredBy) {
    await User.findByIdAndUpdate(user.referredBy, {
      $inc: { totalCommissions: Math.round(totalNewForReferrer * 100) / 100 }
    });
  }

  return { synced: totalNewForUser, forReferrer: totalNewForReferrer };
}

// GET - Liste des retraits
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    await connectDB();

    const query = { userId: payload.userId };
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Withdrawal.countDocuments(query);

    // Stats globales
    const stats = await Withdrawal.aggregate([
      { $match: { userId: payload.userId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w._id,
        amount: w.amount,
        type: w.type,
        status: w.status,
        method: w.paymentMethod,
        accountNumber: w.accountNumber,
        requestedAt: w.createdAt,
        processedAt: w.processedAt,
        rejectionReason: w.rejectionReason
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        pending: stats.find(s => s._id === 'pending')?.total || 0,
        approved: stats.find(s => s._id === 'approved')?.total || 0,
        completed: stats.find(s => s._id === 'completed')?.total || 0,
        rejected: stats.find(s => s._id === 'rejected')?.total || 0
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Demander un retrait
export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { amount, type, paymentMethod, accountNumber, accountName } = await request.json();

    // Validation montant minimum
    const minAmount = type === 'bonus' ? 100 : 1000;
    if (!amount || amount < minAmount) {
      return NextResponse.json(
        { success: false, message: `Montant minimum : ${minAmount.toLocaleString()} FCFA` },
        { status: 400 }
      );
    }

    if (!type || !['gains', 'commissions', 'bonus'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Type de retrait invalide. Types disponibles: gains, commissions, bonus' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !accountNumber || !accountName) {
      return NextResponse.json(
        { success: false, message: 'Informations de paiement manquantes' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le statut du compte
    if (user.status === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'Compte bloqué' },
        { status: 403 }
      );
    }

    // ==================== VÉRIFICATION KYC (PREMIER RETRAIT SEULEMENT) ====================
    if (!user.hasWithdrawn && user.kyc.status !== 'approved') {
      return NextResponse.json({
        success: false,
        needsKYC: true,
        message: 'Veuillez compléter votre KYC pour effectuer votre premier retrait',
        kycStatus: user.kyc.status
      }, { status: 403 });
    }

    // ==================== COOLDOWN 3 JOURS (bénéfices uniquement) ====================
    if (type === 'gains') {
      const lastGainsWithdrawal = await Withdrawal.findOne({
        userId: user._id,
        type: 'gains',
        status: { $in: ['pending', 'approved', 'completed'] }
      }).sort({ createdAt: -1 });

      if (lastGainsWithdrawal) {
        const daysSinceLast = (Date.now() - new Date(lastGainsWithdrawal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast < 3) {
          const nextDate = new Date(new Date(lastGainsWithdrawal.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000);
          return NextResponse.json({
            success: false,
            cooldown: true,
            message: `Vous devez attendre 3 jours entre chaque retrait de bénéfices.\n\nProchain retrait possible le ${nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            nextWithdrawDate: nextDate
          }, { status: 400 });
        }
      }
    }

    // ==================== VÉRIFICATION BLOCAGE BÉNÉFICES ====================
    if (type === 'gains' && user.benefitsBlocked) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Vos bénéfices personnels sont bloqués car vous n\'avez pas atteint votre défi de niveau',
        details: {
          level: user.level,
          target: user.currentLevelTarget,
          current: user.currentLevelCagnotte,
          missing: user.currentLevelTarget - user.currentLevelCagnotte,
          commissionsAvailable: user.totalCommissions,
          bonusAvailable: user.bonusParrainage
        }
      }, { status: 403 });
    }

    // ==================== SYNC GAINS EN DB AVANT RETRAIT ====================
    // Pour les bénéfices : on synchronise les gains live dans user.balance
    // Pour les commissions : le parrain est crédité par le sync de ses filleuls
    if (type === 'gains') {
      await syncUserEarnings(user);
    } else if (type === 'commissions') {
      // Synchroniser les gains de tous les filleuls pour mettre à jour les commissions
      const referrals = await User.find({ referredBy: user._id }).select('_id referredBy');
      for (const referral of referrals) {
        await syncUserEarnings(referral);
      }
      // Recharger l'user car ses commissions ont pu être mises à jour par syncUserEarnings
      await user.constructor.findById(user._id).then(fresh => {
        user.totalCommissions = fresh.totalCommissions;
      });
    }

    // ==================== VÉRIFICATION SOLDE (maintenant à jour en DB) ====================
    let availableBalance = 0;

    if (type === 'gains') {
      availableBalance = user.balance || 0;

    } else if (type === 'commissions') {
      availableBalance = user.totalCommissions || 0;

    } else if (type === 'bonus') {
      if (user.level >= 10) {
        availableBalance = user.bonusParrainage || 0;
      } else {
        availableBalance = (user.bonusParrainage || 0) * 0.01;
      }
    }

    // Arrondir vers le bas
    availableBalance = Math.floor(Math.max(availableBalance, 0));

    if (amount > availableBalance) {
      return NextResponse.json(
        { success: false, message: `Solde insuffisant. Disponible: ${availableBalance.toLocaleString()} FCFA` },
        { status: 400 }
      );
    }

    // ==================== DÉDUIRE IMMÉDIATEMENT DU SOLDE ====================
    if (type === 'gains') {
      user.balance = Math.round(((user.balance || 0) - amount) * 100) / 100;
    } else if (type === 'commissions') {
      user.totalCommissions = Math.round(((user.totalCommissions || 0) - amount) * 100) / 100;
    } else if (type === 'bonus') {
      user.bonusParrainage = Math.round(((user.bonusParrainage || 0) - amount) * 100) / 100;
    }

    user.totalWithdrawn = (user.totalWithdrawn || 0) + amount;

    if (!user.hasWithdrawn) {
      user.hasWithdrawn = true;
    }

    await user.save();

    // ==================== CRÉER LE RETRAIT ====================
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      type,
      paymentMethod,
      accountNumber,
      accountName,
      status: 'pending'
    });

    // 🔔 NOTIFICATION: Demande de retrait enregistrée
    const typeLabel = type === 'gains' ? 'Bénéfices' :
                     type === 'commissions' ? 'Commissions' : 'Bonus';
    try {
      await createNotification(
        user._id,
        NotificationTemplates.withdrawalRequested(amount, typeLabel)
      );
    } catch (e) {
      console.error('Notification error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Demande de retrait créée avec succès',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        type: withdrawal.type,
        status: withdrawal.status,
        estimatedProcessingTime: '24-48 heures',
        createdAt: withdrawal.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}