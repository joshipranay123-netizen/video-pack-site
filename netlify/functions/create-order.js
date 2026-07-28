const Razorpay = require('razorpay');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Server missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars' }),
    };
  }

  let amount;
  try {
    const body = JSON.parse(event.body || '{}');
    amount = body.amount;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!amount || typeof amount !== 'number' || amount < 100) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Amount must be a number >= 100 paise' }),
    };
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Razorpay order creation failed',
        details: err.error ? err.error.description : err.message,
        statusCode: err.statusCode || null,
      }),
    };
  }
};
