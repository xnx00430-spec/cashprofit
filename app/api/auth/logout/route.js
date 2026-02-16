import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    // Clear auth cookies

await clearAuthCookies();
    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    }, { status: 200 });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}