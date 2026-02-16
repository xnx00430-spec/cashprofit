// lib/pawapay.js

const PAWAPAY_BASE_URL = 'https://api.pawapay.io';

export async function createPaymentPage({ depositId, amount, country, returnUrl, reason, msisdn }) {
  const token = process.env.PAWAPAY_API_TOKEN;
  
  if (!token) {
    throw new Error('PAWAPAY_API_TOKEN non configuré');
  }

  const body = {
    depositId,
    returnUrl,
    reason: 'CashProfit Investment',
  };

  // Pré-remplir le montant (format PawaPay v2)
  if (amount) {
    body.amountDetails = {
      amount: String(Math.round(amount)),
      currency: 'XOF'
    };
    body.country = country || 'CIV';
  }

  // Fixer le numéro si fourni
  if (msisdn) body.msisdn = msisdn;

  console.log('💳 PawaPay Payment Page request:', JSON.stringify(body));

  const response = await fetch(`${PAWAPAY_BASE_URL}/v2/paymentpage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ PawaPay error:', data);
    return { success: false, error: data };
  }

  console.log('✅ PawaPay Payment Page created:', data.redirectUrl?.substring(0, 80) + '...');

  return {
    success: true,
    redirectUrl: data.redirectUrl,
    depositId,
  };
}

export async function checkDepositStatus(depositId) {
  const token = process.env.PAWAPAY_API_TOKEN;

  const response = await fetch(`${PAWAPAY_BASE_URL}/deposits/${depositId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return { status: 'NOT_FOUND' };
  }

  const data = await response.json();

  return {
    status: 'FOUND',
    data: Array.isArray(data) ? data[0] : data,
  };
}

export function generateDepositId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}