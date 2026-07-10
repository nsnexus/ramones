// api/process-payment.js
module.exports = async (req, res) => {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { orderId, email, total, ...paymentData } = body;

    if (!orderId || !total) {
      return res.status(400).json({ error: 'orderId e total são obrigatórios.' });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ 
        error: 'Erro de Configuração: Variável MERCADO_PAGO_ACCESS_TOKEN não está configurada no servidor Vercel.' 
      });
    }

    // Gerar uma chave de idempotência única
    const idempotencyKey = `mp-process-${orderId}-${Date.now()}`;

    // Montar o corpo da requisição para a API v1/payments do Mercado Pago
    const mpRequestBody = {
      transaction_amount: Number(total),
      description: `Pedido Ramones #${orderId}`,
      payment_method_id: paymentData.payment_method_id || paymentData.paymentMethodId,
      payer: {
        email: email || paymentData.payer?.email || 'cliente@ramones.com',
      },
      external_reference: orderId
    };

    // Adicionar CPF/CNPJ se fornecido na identificação do pagador
    if (paymentData.payer?.identification) {
      mpRequestBody.payer.identification = paymentData.payer.identification;
    }

    // Se for pagamento com cartão de crédito
    if (paymentData.token) {
      mpRequestBody.token = paymentData.token;
    }
    if (paymentData.installments) {
      mpRequestBody.installments = Number(paymentData.installments);
    }
    if (paymentData.issuer_id) {
      mpRequestBody.issuer_id = paymentData.issuer_id;
    }

    console.log("Enviando pagamento para Mercado Pago:", {
      payment_method_id: mpRequestBody.payment_method_id,
      transaction_amount: mpRequestBody.transaction_amount,
      external_reference: mpRequestBody.external_reference
    });

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(mpRequestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na API do Mercado Pago:", data);
      return res.status(response.status).json({ 
        error: data.message || 'Erro ao processar o pagamento no gateway.',
        details: data.cause || []
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Process Payment Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
