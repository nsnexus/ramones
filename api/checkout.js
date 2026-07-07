// api/checkout.js
module.exports = async (req, res) => {
  // Configuração de CORS para permitir requisições do frontend
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
    // Ler os itens enviados pelo corpo da requisição (body)
    // Se req.body for uma string, fazemos o parse. Vercel geralmente faz o parse automático para JSON.
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { items } = body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'O carrinho está vazio' });
    }

    // Pega o token privado do Mercado Pago das variáveis de ambiente do servidor
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ 
        error: 'Erro de Configuração: Variável MERCADO_PAGO_ACCESS_TOKEN não está configurada no servidor Vercel.' 
      });
    }

    // Formatar os itens do carrinho no padrão exigido pela API de Preferência do Mercado Pago
    const mpItems = items.map(item => ({
      title: `${item.name} (Tamanho: ${item.size})`,
      quantity: 1,
      unit_price: Number(item.price),
      currency_id: 'BRL'
    }));

    // Chamada direta para a API Oficial de Preferências do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: mpItems,
        back_urls: {
          success: `${req.headers.origin || 'http://' + req.headers.host}/#success`,
          failure: `${req.headers.origin || 'http://' + req.headers.host}/#failure`,
          pending: `${req.headers.origin || 'http://' + req.headers.host}/#pending`
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar a preferência de pagamento no Mercado Pago.');
    }

    // Retorna a URL segura de checkout do Mercado Pago (init_point)
    return res.status(200).json({ url: data.init_point });
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
