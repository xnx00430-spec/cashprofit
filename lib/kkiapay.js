// lib/kkiapay.js
import { kkiapay } from '@kkiapay-org/nodejs-sdk';

// ==================== INITIALISATION ====================
const k = kkiapay({
  publickey: process.env.KKIAPAY_PUBLIC_KEY,
  privatekey: process.env.KKIAPAY_PRIVATE_KEY,
  secretkey: process.env.KKIAPAY_SECRET_KEY,
  sandbox: process.env.KKIAPAY_SANDBOX === 'true',
});

// ==================== VÉRIFIER UNE TRANSACTION ====================
// Retourne les détails de la transaction (status, amount, transactionId, etc.)
export async function verifyTransaction(transactionId) {
  try {
    const response = await k.verify(transactionId);
    console.log(`🔍 KkiaPay verify [${transactionId}]:`, JSON.stringify(response));
    return {
      success: true,
      data: response,
      status: response.status,          // 'SUCCESS', 'FAILED', 'PENDING'
      amount: response.amount,           // Montant payé
      source: response.source,           // 'MOBILE_MONEY', 'CARD'
      transactionId: response.transactionId,
      performedAt: response.performedAt || response.performed_at,
    };
  } catch (error) {
    console.error(`❌ KkiaPay verify failed [${transactionId}]:`, error.message || error);
    return {
      success: false,
      error: error.message || 'Verification failed',
      status: 'ERROR',
    };
  }
}

// ==================== VÉRIFIER LA SIGNATURE WEBHOOK ====================
// KkiaPay signe les webhooks avec le header 'x-kkiapay-secret'
// La signature doit correspondre au secret configuré dans le dashboard KkiaPay
export function verifyWebhookSignature(request) {
  const signature = request.headers.get('x-kkiapay-secret');
  const webhookSecret = process.env.KKIAPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️ KKIAPAY_WEBHOOK_SECRET non configuré - webhook non vérifié');
    return true; // Laisser passer si pas de secret configuré (dev)
  }

  if (!signature) {
    console.error('❌ Pas de signature x-kkiapay-secret dans le webhook');
    return false;
  }

  return signature === webhookSecret;
}

// ==================== REMBOURSER UNE TRANSACTION ====================
export async function refundTransaction(transactionId) {
  try {
    const response = await k.refund(transactionId);
    console.log(`💸 KkiaPay refund [${transactionId}]:`, JSON.stringify(response));
    return { success: true, data: response };
  } catch (error) {
    console.error(`❌ KkiaPay refund failed [${transactionId}]:`, error.message || error);
    return { success: false, error: error.message };
  }
}

export default k;