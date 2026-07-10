// functions/api/process-payment.js

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json();
    const { orderId, email, total, ...paymentData } = body;

    if (!orderId || !total) {
      return new Response(JSON.stringify({ error: 'orderId e total são obrigatórios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Acessa o token do Mercado Pago salvo nas variáveis de ambiente da Cloudflare
    const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: 'Erro de Configuração: Variável MERCADO_PAGO_ACCESS_TOKEN não está configurada na Cloudflare.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
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

    console.log("Enviando pagamento para Mercado Pago (Cloudflare):", {
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
      console.error("Erro na API do Mercado Pago (Cloudflare):", data);
      return new Response(JSON.stringify({ 
        error: data.message || 'Erro ao processar o pagamento no gateway.',
        details: data.cause || []
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Process Payment Error (Cloudflare):', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Tratamento de requisições de CORS preflight (OPTIONS)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
