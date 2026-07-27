const crypto = require('crypto');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Razorpay credentials not configured on the server' }),
    };
  }

  let razorpay_order_id, razorpay_payment_id, razorpay_signature;
  try {
    const body = JSON.parse(event.body || '{}');
    razorpay_order_id = body.razorpay_order_id;
    razorpay_payment_id = body.razorpay_payment_id;
    razorpay_signature = body.razorpay_signature;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ verified: false, error: 'Signature mismatch — payment not verified' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ verified: true, payment_id: razorpay_payment_id }),
  };
};
