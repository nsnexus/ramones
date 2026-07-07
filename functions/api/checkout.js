// functions/api/checkout.js

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
    const { items } = body;
    
    if (!items || !items.length) {
      return new Response(JSON.stringify({ error: 'O carrinho está vazio' }), {
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

    // Formatar os itens do carrinho no padrão do Mercado Pago
    const mpItems = items.map(item => ({
      title: `${item.name} (Tamanho: ${item.size})`,
      quantity: 1,
      unit_price: Number(item.price),
      currency_id: 'BRL'
    }));

    const origin = new URL(request.url).origin;

    // Chamada para a API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: mpItems,
        back_urls: {
          success: `${origin}/#success`,
          failure: `${origin}/#failure`,
          pending: `${origin}/#pending`
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar preferência de pagamento no Mercado Pago.');
    }

    // Retorna a URL de checkout
    return new Response(JSON.stringify({ url: data.init_point }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Checkout Error:', error);
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
