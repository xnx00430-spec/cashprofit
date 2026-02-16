// app/api/cron/sync-earnings/route.js
import { NextResponse } from 'next/server';
import { syncEarnings } from '@/lib/cron/syncEarnings';

// Clé secrète pour protéger le cron (à mettre dans .env)
const CRON_SECRET = process.env.CRON_SECRET || 'default-cron-secret';

export async function GET(request) {
  try {
    // Vérifier l'authentification (Vercel Cron ou clé secrète)
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const isVercelCron = authHeader === `Bearer ${CRON_SECRET}`;
    const isKeyValid = key === CRON_SECRET;

    if (!isVercelCron && !isKeyValid) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const result = await syncEarnings();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}