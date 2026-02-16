import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// POST - Bloquer ou débloquer un utilisateur (ADMIN ONLY)
export async function POST(request, { params }) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { action, reason } = await request.json();

    if (!action || !['block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action invalide' },
        { status: 400 }
      );
    }

    if (action === 'block' && !reason) {
      return NextResponse.json(
        { success: false, message: 'Raison de blocage requise' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(params.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Ne pas bloquer un admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Impossible de bloquer un administrateur' },
        { status: 400 }
      );
    }

    if (action === 'block') {
      user.status = 'blocked';
      user.blockReason = reason;
      user.blockedAt = new Date();
      user.blockedBy = payload.userId;
    } else {
      user.status = 'confirmed';
      user.blockReason = null;
      user.blockedAt = null;
      user.blockedBy = null;
    }

    await user.save();

    // TODO: Envoyer notification email/SMS

    return NextResponse.json({
      success: true,
      message: action === 'block' 
        ? 'Utilisateur bloqué avec succès'
        : 'Utilisateur débloqué avec succès',
      user: {
        id: user._id,
        name: user.name,
        status: user.status,
        blockReason: user.blockReason
      }
    });

  } catch (error) {
    console.error('Admin block user error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}