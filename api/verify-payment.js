// api/verify-payment.js
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

  try {
    let paymentId;
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      paymentId = body.paymentId;
    } else if (req.method === 'GET') {
      paymentId = req.query.id || req.query.paymentId;
    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    if (!paymentId) {
      return res.status(400).json({ error: 'ID do pagamento não fornecido.' });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ 
        error: 'Erro de Configuração: Variável MERCADO_PAGO_ACCESS_TOKEN não está configurada no servidor Vercel.' 
      });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro ao consultar Mercado Pago:", data);
      return res.status(mpResponse.status).json({ 
        error: data.message || 'Erro ao consultar o status do pagamento.' 
      });
    }

    return res.status(200).json({
      status: data.status, // 'approved', 'pending', 'in_process', 'rejected'
      status_detail: data.status_detail,
      id: data.id,
      external_reference: data.external_reference
    });

  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
