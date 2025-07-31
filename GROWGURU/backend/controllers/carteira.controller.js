const supabase = require('../supabase');

const getCarteira = async (req, res) => {
  try {
    // Buscar ID numérico do usuário na tabela usuarios
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (userError || !usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar investimentos usando o ID numérico
    const { data: investimentos, error: investError } = await supabase
      .from('carteira_investimentos')
      .select(`
        id,
        quantidade,
        valor_compra,
        data_compra,
        ativos (codigo, nome, tipo, preco_atual),
        estrategias (id, nome)
      `)
      .eq('usuario_id', usuario.id);

    if (investError) throw investError;

    // Calcular totais e porcentagens
    const estrategiasMap = new Map();

    investimentos.forEach(investimento => {
      const estrategia = investimento.estrategias;
      const ativo = investimento.ativos;
      const total = investimento.quantidade * investimento.valor_compra;

      if (!estrategiasMap.has(estrategia.id)) {
        estrategiasMap.set(estrategia.id, {
          id: estrategia.id,
          nome: estrategia.nome,
          total_investido: 0,
          ativos: []
        });
      }

      const estrategiaEntry = estrategiasMap.get(estrategia.id);
      estrategiaEntry.total_investido += total;
      estrategiaEntry.ativos.push({
        codigo: ativo.codigo,
        nome: ativo.nome,
        quantidade: investimento.quantidade,
        valor_medio: investimento.valor_compra,
        valor_atual: ativo.preco_atual
      });
    });

    // Calcular porcentagens
    const totalGeral = [...estrategiasMap.values()].reduce((acc, e) => acc + e.total_investido, 0);
    const carteira = [...estrategiasMap.values()].map(e => ({
      ...e,
      porcentagem: totalGeral > 0 ? (e.total_investido / totalGeral * 100).toFixed(2) : 0
    }));

    res.json(carteira);

  } catch (error) {
    console.error('Erro na carteira:', error);
    res.status(500).json({ error: 'Erro ao carregar carteira' });
  }
};

const buyAsset = async (req, res) => {
  try {
    // Buscar o ID numérico do usuário na tabela "usuarios"
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    if (userError) throw userError;

    // Extrair os dados do corpo da requisição
    const { codigo_ativo, quantidade, valor_compra, estrategia_id } = req.body;
    if (!codigo_ativo || !quantidade || typeof estrategia_id === 'undefined') {
      return res.status(400).json({ error: 'Dados inválidos: código do ativo, quantidade ou estratégia_id ausentes' });
    }
    if (isNaN(quantidade) || quantidade <= 0) throw new Error('Quantidade inválida');
    if (isNaN(valor_compra) || valor_compra <= 0) throw new Error('Valor inválido');

    // Verificar se já existe um registro para esse ativo e estratégia
    const { data: registro, error: registroError } = await supabase
      .from('carteira_investimentos')
      .select('id, quantidade, valor_compra')
      .eq('usuario_id', usuario.id)
      .eq('codigo_ativo', codigo_ativo)
      .eq('estrategia_id', estrategia_id)
      .single();

    if (registroError) {
      // Se não encontrar registro, insere um novo
      const { data: novaCompra, error: insertError } = await supabase
        .from('carteira_investimentos')
        .insert([{
          usuario_id: usuario.id,
          codigo_ativo,
          quantidade,
          valor_compra,
          estrategia_id,
          data_compra: new Date().toISOString()
        }]);
      if (insertError) throw insertError;
      return res.json({ message: 'Compra realizada com sucesso', data: novaCompra });
    } else {
      // Se o registro já existir, atualizar a quantidade e o valor médio ponderado
      const quantidadeAtual = parseFloat(registro.quantidade);
      const valorAtual = parseFloat(registro.valor_compra);
      const novaQuantidade = quantidadeAtual + quantidade;
      // Valor médio ponderado: ((quantidadeAtual * valorAtual) + (quantidade * valor_compra)) / novaQuantidade
      const novoValorCompra = ((quantidadeAtual * valorAtual) + (quantidade * valor_compra)) / novaQuantidade;

      const { data: updateData, error: updateError } = await supabase
        .from('carteira_investimentos')
        .update({
          quantidade: novaQuantidade,
          valor_compra: novoValorCompra,
          data_compra: newtoISOString()
        })
        .eq('id', registro.id);

      if (updateError) throw updateError;
      return res.json({ message: 'Compra atualizada com sucesso', data: updateData });
    }
  } catch (error) {
    console.error('Erro na compra:', error);
    res.status(500).json({ error: 'Erro ao processar compra' });
  }
};

const sellAsset = async (req, res) => {
  try {
    // Buscar o ID numérico do usuário na tabela "usuarios"
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    if (userError || !usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Extrair dados do corpo da requisição
    const { codigo_ativo, quantidade, estrategia_id } = req.body;
    if (!codigo_ativo || !quantidade || typeof estrategia_id === 'undefined') {
      return res.status(400).json({ error: 'Dados inválidos: código do ativo, quantidade ou estratégia_id ausentes' });
    }

    // Buscar todos os registros existentes na carteira para este ativo e estratégia
    const { data: registros, error: registroError } = await supabase
      .from('carteira_investimentos')
      .select('id, quantidade')
      .eq('usuario_id', usuario.id)
      .eq('codigo_ativo', codigo_ativo)
      .eq('estrategia_id', estrategia_id);

    if (registroError) throw registroError;
    if (!registros || registros.length === 0) {
      return res.status(404).json({ error: 'Registro de investimento não encontrado' });
    }

    // Somar as quantidades de todos os registros
    const totalDisponivel = registros.reduce((acc, r) => acc + parseFloat(r.quantidade), 0);
    if (totalDisponivel < quantidade) {
      return res.status(400).json({ error: 'Quantidade insuficiente para venda' });
    }

    // Calcular nova quantidade agregada após a venda
    const novaQuantidade = totalDisponivel - quantidade;

    // Escolher o registro principal para atualização (por exemplo, o de menor id)
    registros.sort((a, b) => a.id - b.id);
    const registroPrincipal = registros[0];

    // Atualizar o registro principal com a nova quantidade
    const { data: atualizado, error: updateError } = await supabase
      .from('carteira_investimentos')
      .update({ quantidade: novaQuantidade })
      .eq('id', registroPrincipal.id);

    if (updateError) throw updateError;

    // Se houver outros registros, excluí-los para manter apenas um registro agregado
    if (registros.length > 1) {
      const idsParaDeletar = registros.slice(1).map(r => r.id);
      const { error: deleteError } = await supabase
        .from('carteira_investimentos')
        .delete()
        .in('id', idsParaDeletar);
      if (deleteError) throw deleteError;
    }

    res.json({ message: 'Venda realizada com sucesso', updated: atualizado });
  } catch (error) {
    console.error('Erro na venda:', error);
    res.status(500).json({ error: 'Erro ao processar venda' });
  }
};

module.exports = {
  getCarteira,
  buyAsset,
  sellAsset
};
