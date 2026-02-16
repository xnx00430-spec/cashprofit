import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets not defined in environment variables');
}

/**
 * Génère un access token JWT
 */
export function generateAccessToken(userId, role = 'user') {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Génère un refresh token JWT
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Vérifie un access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Vérifie un refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Set httpOnly cookies (Access + Refresh tokens)
 */
export async function setAuthCookies(accessToken, refreshToken) {
  const cookieStore = await cookies();
  
  // Access token - 7 jours
  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
    path: '/'
  });

  // Refresh token - 30 jours
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
    path: '/'
  });
}

/**
 * Clear auth cookies (logout)
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

/**
 * Get access token from cookies
 */
export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value || null;
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value || null;
}

/**
 * Vérifie si l'utilisateur est authentifié
 * Retourne le payload du token ou null
 */
export async function verifyAuth() {
  const token = await getAccessToken();
  
  if (!token) {
    return null;
  }
  
  return verifyAccessToken(token);
}

/**
 * Vérifie si l'utilisateur est admin
 */
export async function verifyAdmin() {
  const payload = await verifyAuth();
  
  if (!payload || payload.role !== 'admin') {
    return false;
  }
  
  return true;
}

/**
 * Extrait l'userId du token
 */
export async function getUserIdFromToken() {
  const payload = await verifyAuth();
  return payload?.userId || null;
}