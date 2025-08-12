const supabase = require('../config/supabaseClient');

// @desc    Registrar compra de ativo na carteira
// @route   POST /api/carteira
// @access  Private
const buyAsset = async (req, res) => {
  try {
    const { user } = req;
    const { codigo_ativo, quantidade, valor_compra, estrategia_id } = req.body;

    if (!codigo_ativo || !quantidade || typeof estrategia_id === 'undefined' || !valor_compra) {
      return res.status(400).json({ error: 'Dados inválidos: código do ativo, quantidade, valor_compra ou estrategia_id ausentes' });
    }
    if (isNaN(quantidade) || quantidade <= 0) return res.status(400).json({ error: 'Quantidade inválida' });
    if (isNaN(valor_compra) || valor_compra <= 0) return res.status(400).json({ error: 'Valor de compra inválido' });

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, saldo')
      .eq('user_id', user.id)
      .single();
    if (userError) throw userError;

    const valorTotalCompra = quantidade * valor_compra;
    const limiteCredito = -1000;
    const novoSaldo = parseFloat(usuario.saldo) - valorTotalCompra;

    if (novoSaldo < limiteCredito) {
      return res.status(400).json({
        error: `Limite de crédito excedido. Seu limite é de R$ ${Math.abs(limiteCredito).toFixed(2)}`
      });
    }

    const { data: registro, error: registroError } = await supabase
      .from('carteira_investimentos')
      .select('id, quantidade, valor_compra')
      .eq('usuario_id', usuario.id)
      .eq('codigo_ativo', codigo_ativo)
      .eq('estrategia_id', estrategia_id)
      .single();

    if (registroError) {
      const { data: novaCompra, error: insertError } = await supabase
        .from('carteira_investimentos')
        .insert([{
          usuario_id: usuario.id,
          codigo_ativo,
          quantidade,
          valor_compra,
          estrategia_id,
          data_compra: new Date().toISOString()
        }])
        .select()
        .single();
      if (insertError) throw insertError;

      const { error: updateSaldoError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldo })
        .eq('id', usuario.id);
      if (updateSaldoError) throw new Error('Erro ao atualizar saldo do usuário');

      await supabase.from('transacoes').insert([{
        usuario_id: usuario.id,
        tipo: 'compra',
        valor: -Math.abs(valorTotalCompra),
        descricao: `Compra de ${quantidade} cotas de ${codigo_ativo}`,
        data: new Date().toISOString(),
        codigo_ativo,
        quantidade,
        valor_unitario: valor_compra,
        valor_total: valorTotalCompra
      }]);

      return res.json({ message: 'Compra registrada com sucesso', data: { ...novaCompra, novo_saldo: novoSaldo } });
    } else {
      const quantidadeAtual = parseFloat(registro.quantidade);
      const valorAtual = parseFloat(registro.valor_compra);
      const novaQuantidade = quantidadeAtual + quantidade;

      const valorTotalAtual = quantidadeAtual * valorAtual;
      const valorTotalNovaCompra = quantidade * valor_compra;
      const novoValorMedio = (valorTotalAtual + valorTotalNovaCompra) / novaQuantidade;

      const { data: updateData, error: updateError } = await supabase
        .from('carteira_investimentos')
        .update({
          quantidade: novaQuantidade,
          valor_compra: novoValorMedio,
          data_compra: new Date().toISOString()
        })
        .eq('id', registro.id)
        .select()
        .single();
      if (updateError) throw updateError;

      const { error: updateSaldoError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldo })
        .eq('id', usuario.id);
      if (updateSaldoError) throw new Error('Erro ao atualizar saldo do usuário');

      await supabase.from('transacoes').insert([{
        usuario_id: usuario.id,
        tipo: 'compra',
        valor: -Math.abs(valorTotalCompra),
        descricao: ` ${quantidade} cotas de ${codigo_ativo}`,
        data: new Date().toISOString(),
        codigo_ativo,
        quantidade,
        valor_unitario: valor_compra,
        valor_total: valorTotalCompra
      }]);

      return res.json({ message: 'Compra atualizada com sucesso', data: { ...updateData, novo_saldo: novoSaldo } });
    }
  } catch (error) {
    console.error('Erro na compra:', error);
    res.status(500).json({ error: 'Erro ao processar compra', details: error.message });
  }
};

// @desc    Registrar venda de ativo na carteira
// @route   POST /api/vender
// @access  Private
const sellAsset = async (req, res) => {
  try {
    const { user } = req;
    const { codigo_ativo, quantidade, estrategia_id } = req.body;

    if (!codigo_ativo || !quantidade || typeof estrategia_id === 'undefined') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, saldo')
      .eq('user_id', user.id)
      .single();
    if (userError || !usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { data: registros, error: registroError } = await supabase
      .from('carteira_investimentos')
      .select('id, quantidade')
      .eq('usuario_id', usuario.id)
      .eq('codigo_ativo', codigo_ativo)
      .eq('estrategia_id', estrategia_id);

    if (registroError) throw registroError;
    if (!registros || registros.length === 0) return res.status(404).json({ error: 'Registro de investimento não encontrado' });

    const totalDisponivel = registros.reduce((acc, r) => acc + parseFloat(r.quantidade), 0);
    if (totalDisponivel < quantidade) return res.status(400).json({ error: 'Quantidade insuficiente para venda' });

    registros.sort((a, b) => a.id - b.id);
    const registroPrincipal = registros[0];

    const { data: ativo, error: ativoError } = await supabase
      .from('carteira_investimentos')
      .select('valor_compra')
      .eq('id', registroPrincipal.id)
      .single();
    if (ativoError) throw ativoError;

    const precoVenda = parseFloat(req.body.preco_venda) || ativo.valor_compra;
    const valorTotalVenda = quantidade * precoVenda;
    const novoSaldo = parseFloat(usuario.saldo) + valorTotalVenda;

    const { error: updateSaldoError } = await supabase.from('usuarios').update({ saldo: novoSaldo }).eq('id', usuario.id);
    if (updateSaldoError) throw new Error('Erro ao atualizar saldo do usuário');

    const novaQuantidade = totalDisponivel - quantidade;
    let atualizado = null;

    if (novaQuantidade > 0) {
      const { data, error } = await supabase.from('carteira_investimentos').update({ quantidade: novaQuantidade, data_compra: new Date().toISOString() }).eq('id', registroPrincipal.id).select().single();
      if (error) throw error;
      atualizado = data;
    } else {
      const { error } = await supabase.from('carteira_investimentos').delete().eq('id', registroPrincipal.id);
      if (error) throw error;
    }

    const { error: transacaoError } = await supabase.from('transacoes').insert([{
      usuario_id: usuario.id,
      tipo: 'venda',
      valor: valorTotalVenda,
      descricao: ` ${quantidade} cotas de ${codigo_ativo}`,
      data: new Date().toISOString(),
      codigo_ativo,
      quantidade: -quantidade,
      valor_unitario: precoVenda,
      valor_total: valorTotalVenda
    }]).select().single();
    if (transacaoError) throw transacaoError;

    if (registros.length > 1) {
      const idsParaDeletar = registros.slice(1).map(r => r.id);
      await supabase.from('carteira_investimentos').delete().in('id', idsParaDeletar);
    }

    res.json({ message: 'Venda realizada com sucesso', data: { ...(atualizado || {}), novo_saldo: novoSaldo } });
  } catch (error) {
    console.error('Erro na venda:', error);
    res.status(500).json({ error: 'Erro ao processar venda' });
  }
};

// @desc    Buscar a carteira de investimentos do usuário
// @route   GET /api/carteira
// @access  Private
const getPortfolio = async (req, res) => {
  try {
    const { user } = req;
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (userError || !usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { data: carteira, error: carteiraError } = await supabase
      .from('carteira_investimentos')
      .select(`
        id,
        codigo_ativo,
        quantidade,
        valor_compra,
        estrategias (id, nome),
        ativos!inner(codigo, preco_atual)
      `)
      .eq('usuario_id', usuario.id)
      .order('codigo_ativo', { ascending: true });
    if (carteiraError) throw carteiraError;
    if (carteira.length === 0) return res.json([]);

    const carteiraPorEstrategia = {};
    carteira.forEach(item => {
      if (!item.estrategias) return;
      const { id: estrategiaId, nome: estrategiaNome } = item.estrategias;
      if (!carteiraPorEstrategia[estrategiaId]) {
        carteiraPorEstrategia[estrategiaId] = { id: estrategiaId, nome: estrategiaNome, total_investido: 0, ativos: [] };
      }
      const quantidade = parseFloat(item.quantidade);
      const valorMedio = parseFloat(item.valor_compra);
      const valorTotal = quantidade * valorMedio;

      carteiraPorEstrategia[estrategiaId].ativos.push({
        codigo: item.codigo_ativo,
        quantidade,
        valor_medio: valorMedio,
        preco_atual: item.ativos?.preco_atual || null,
        valor_total: valorTotal
      });
      carteiraPorEstrategia[estrategiaId].total_investido += valorTotal;
    });

    const totalGeral = Object.values(carteiraPorEstrategia).reduce((total, est) => total + est.total_investido, 0);
    const resultado = Object.values(carteiraPorEstrategia).map(est => ({
      ...est,
      porcentagem: totalGeral > 0 ? parseFloat(((est.total_investido / totalGeral) * 100).toFixed(2)) : 0
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao carregar carteira:', error);
    res.status(500).json({ error: 'Erro ao carregar carteira', details: error.message });
  }
};

// @desc    Obter o total investido pelo usuário
// @route   GET /api/total-investido
// @access  Private
const getTotalInvested = async (req, res) => {
  try {
    const { user } = req;
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (userError || !usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { data: carteira, error: carteiraError } = await supabase
      .from('carteira_investimentos')
      .select('quantidade, valor_compra')
      .eq('usuario_id', usuario.id);
    if (carteiraError) throw carteiraError;

    const totalInvestido = carteira.reduce((total, item) => total + (parseFloat(item.quantidade) * parseFloat(item.valor_compra)), 0);
    res.json({ total_investido: totalInvestido });
  } catch (error) {
    console.error('Erro ao calcular total investido:', error);
    res.status(500).json({ error: 'Erro ao calcular total investido' });
  }
};

module.exports = {
  buyAsset,
  sellAsset,
  getPortfolio,
  getTotalInvested,
};
