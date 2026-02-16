import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Arbre généalogique complet (10 niveaux de profondeur)
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

    // Construire l'arbre récursivement (max 10 niveaux)
    const tree = await buildReferralTree(user._id, 1, 10);

    // Calculer les stats par niveau
    const levelStats = calculateLevelStats(tree);

    return NextResponse.json({
      success: true,
      tree,
      levelStats,
      totalNetwork: countTotalMembers(tree) - 1 // -1 pour exclure l'utilisateur lui-même
    });

  } catch (error) {
    console.error('Get referral tree error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Fonction récursive pour construire l'arbre
async function buildReferralTree(userId, currentLevel, maxLevel) {
  if (currentLevel > maxLevel) {
    return null;
  }

  const user = await User.findById(userId)
    .select('name email avatar level totalInvested totalEarnings status')
    .lean();

  if (!user) {
    return null;
  }

  // Récupérer les filleuls directs
  const referrals = await User.find({ referredBy: userId })
    .select('_id')
    .lean();

  // Construire récursivement les sous-arbres
  const children = await Promise.all(
    referrals.map(ref => buildReferralTree(ref._id, currentLevel + 1, maxLevel))
  );

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    level: user.level,
    totalInvested: user.totalInvested,
    totalEarnings: user.totalEarnings,
    status: user.status,
    depth: currentLevel,
    children: children.filter(child => child !== null)
  };
}

// Calculer les stats par niveau
function calculateLevelStats(tree) {
  const stats = {};

  function traverse(node) {
    if (!node) return;

    const depth = node.depth;
    if (!stats[depth]) {
      stats[depth] = {
        count: 0,
        totalInvested: 0,
        totalEarnings: 0,
        active: 0
      };
    }

    stats[depth].count++;
    stats[depth].totalInvested += node.totalInvested || 0;
    stats[depth].totalEarnings += node.totalEarnings || 0;
    if (node.status === 'confirmed') {
      stats[depth].active++;
    }

    node.children.forEach(child => traverse(child));
  }

  traverse(tree);
  return stats;
}

// Compter le nombre total de membres
function countTotalMembers(tree) {
  if (!tree) return 0;
  return 1 + tree.children.reduce((sum, child) => sum + countTotalMembers(child), 0);
}