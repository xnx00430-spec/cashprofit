// app/api/user/profile/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import { verifyAuth } from '@/lib/auth';

// Calculer les gains live d'un utilisateur depuis ses investissements
function calculateUserLiveEarnings(investments) {
  const now = new Date();
  let totalEarnings = 0;
  for (const inv of investments) {
    const startDate = new Date(inv.startDate);
    const maxWeeks = inv.maxWeeks || 52;
    const msElapsed = now - startDate;
    const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
    const activeWeeks = Math.min(Math.max(weeksElapsed, 0), maxWeeks);
    const weeklyEarning = inv.amount * (inv.weeklyRate / 100);
    totalEarnings += weeklyEarning * activeWeeks;
  }
  return totalEarnings;
}

// Calculer les commissions live du parrain
// = 10% × (bénéfices live + commissions live) de chaque filleul
async function calculateLiveCommissions(userId) {
  const referrals = await User.find({ referredBy: userId }).lean();
  if (referrals.length === 0) return 0;

  let totalCommission = 0;

  for (const referral of referrals) {
    // Bénéfices live du filleul (100% brut, avant prélèvement)
    const referralInvestments = await Investment.find({
      userId: referral._id,
      status: 'active'
    }).lean();
    const referralEarnings = calculateUserLiveEarnings(referralInvestments);

    // Commissions live du filleul (ses propres filleuls)
    const referralCommissions = await calculateLiveCommissions(referral._id);

    // 10% du total (bénéfices + commissions)
    totalCommission += (referralEarnings + referralCommissions) * 0.10;
  }

  return totalCommission;
}

// GET - Récupérer le profil
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
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

    // Commissions LIVE
    const liveCommissions = await calculateLiveCommissions(user._id);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        level: user.level,
        status: user.status,
        referralCode: user.referralCode || user.sponsorCode,
        sponsorCode: user.sponsorCode,
        referredBy: user.referredBy,
        referredByCode: user.referredByCode,
        hasReferrer: !!user.referredBy, // true si l'user a un parrain
        balance: user.balance || 0,
        totalInvested: user.totalInvested || 0,
        totalEarnings: user.totalEarnings || 0,
        totalCommissions: Math.round(liveCommissions * 100) / 100,
        bonusParrainage: user.bonusParrainage || 0,
        activeInvestments: user.activeInvestments || 0,
        currentLevelStartDate: user.currentLevelStartDate,
        currentLevelDeadline: user.currentLevelDeadline,
        currentLevelTarget: user.currentLevelTarget || 0,
        currentLevelCagnotte: user.currentLevelCagnotte || 0,
        benefitsBlocked: user.benefitsBlocked || false,
        kyc: user.kyc,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

// PUT - Modifier le profil
export async function PUT(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { name, phone, address, dateOfBirth, nationality, city } = await request.json();

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (nationality) user.nationality = nationality;
    if (city) user.city = city;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}