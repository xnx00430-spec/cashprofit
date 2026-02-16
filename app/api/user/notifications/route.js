import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const unreadOnly = searchParams.get('unread') === 'true';

    await connectDB();
    const user = await User.findById(payload.userId);
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // --- SÉCURISATION ICI ---
    // On s'assure que notifications est toujours un tableau, même s'il n'existe pas en DB
    const allNotifications = user.notifications || []; 

    let notifications = [...allNotifications]; // Copie du tableau

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    notifications = notifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    // Utilisation du tableau sécurisé pour le compte
    const unreadCount = allNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      total: allNotifications.length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });

    const { notificationIds, markAllAsRead } = await request.json();
    await connectDB();
    const user = await User.findById(payload.userId);

    if (!user) return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });

    // Sécurisation : si pas de notifications, on ne fait rien
    if (!user.notifications) {
        user.notifications = [];
    }

    if (markAllAsRead) {
      user.notifications.forEach(notif => { notif.read = true; });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      user.notifications.forEach(notif => {
        if (notificationIds.includes(notif._id.toString())) {
          notif.read = true;
        }
      });
    }

    await user.save();
    const unreadCount = user.notifications.filter(n => !n.read).length;

    return NextResponse.json({ success: true, message: 'Notifications marquées comme lues', unreadCount });

  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}