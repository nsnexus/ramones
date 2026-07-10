// functions/api/verify-payment.js

export async function onRequest(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let paymentId;
    if (request.method === 'POST') {
      const body = await request.json();
      paymentId = body.paymentId;
    } else {
      const url = new URL(request.url);
      paymentId = url.searchParams.get('id') || url.searchParams.get('paymentId');
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'ID do pagamento não fornecido.' }), {
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

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro ao consultar Mercado Pago (Cloudflare):", data);
      return new Response(JSON.stringify({ 
        error: data.message || 'Erro ao consultar o status do pagamento.' 
      }), {
        status: mpResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      status: data.status, // 'approved', 'pending', 'in_process', 'rejected'
      status_detail: data.status_detail,
      id: data.id,
      external_reference: data.external_reference
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Verify Payment Error (Cloudflare):', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
