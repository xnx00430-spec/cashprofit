import { NextResponse } from 'next/server';
import { checkLevelDeadlines } from '@/lib/cron/checkLevelDeadlines';

export async function GET(request) {
  try {
    console.log('🚀 Lancement du cron job check-deadlines...');
    
    const result = await checkLevelDeadlines();
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du cron job', error: error.message },
      { status: 500 }
    );
  }
}