require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:8100',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Conexão com Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Rotas de Autenticação
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    });

    if (error) throw error;
    
    res.json({
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(400).json({
      code: error.code || 'AUTH_ERROR',
      message: error.message
    });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { data: { nome: nome.trim() } }
    });

    if (authError) throw authError;

    // Criar perfil na tabela usuarios
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .insert([{
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        user_id: authData.user.id
      }])
      .select();

    if (dbError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    res.json({
      user: {
        ...authData.user,
        profile: userData[0]
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(400).json({
      code: error.code || 'DATABASE_ERROR',
      message: error.message
    });
  }
});

// Rotas Protegidas

// Buscar dados do usuário
app.get('/api/usuarios', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!user || error) return res.status(401).json({ error: 'Não autorizado' });

    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select('id, nome, email, saldo')
      .eq('user_id', user.id)
      .single();

    if (dbError) throw dbError;
    res.json(usuario);

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Buscar transações (GET)
app.get('/api/transacoes', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!user || error) return res.status(401).json({ error: 'Não autorizado' });

    // Buscar ID do usuário na tabela "usuarios"
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (userError) throw userError;

    // Buscar transações
    const { data: transacoes, error: transError } = await supabase
      .from('transacoes')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('data', { ascending: false });

    if (transError) throw transError;

    res.json(transacoes);

  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Registrar transação (POST)
app.post('/api/transacoes', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!user || error) return res.status(401).json({ error: 'Não autorizado' });

    const { valor, tipo, descricao } = req.body;
    const { data: transacao, error: transError } = await supabase.rpc('executar_transacao', {
      user_id: user.id,
      valor_transacao: valor,
      tipo_transacao: tipo,
      descricao_transacao: descricao || 'Operação financeira'
    });

    if (transError) throw transError;
    res.json(transacao);

  } catch (error) {
    console.error('Erro na transação:', error);
    res.status(500).json({ error: 'Erro ao processar transação' });
  }
});

// Buscar estratégias
app.get('/api/estrategias', async (req, res) => {
  try {
    const { data: estrategias, error } = await supabase
      .from('estrategias')
      .select('*')
      .order('nome', { ascending: false });

    if (error) throw error;
    
    res.json(estrategias);
    
  } catch (error) {
    console.error('Erro ao buscar estratégias:', error);
    res.status(500).json({ error: 'Erro ao carregar estratégias' });
  }
});

// Buscar ativos da estratégia
app.get('/api/estrategias/:id/ativos', async (req, res) => {
  try {
    const estrategiaId = req.params.id;

    const { data, error } = await supabase
      .from('ranking_ativos')
      .select(`
        id,
        estrategia_id,
        codigo_ativo,
        posicao,
        rentabilidade,
        ativos:codigo_ativo (
          codigo,
          nome,
          tipo,
          preco_atual
        )
      `)
      .eq('estrategia_id', estrategiaId)
      .order('posicao', { ascending: true });

    if (error) throw error;
    
    res.json(data);

  } catch (error) {
    console.error('Erro ao buscar ativos:', error);
    res.status(500).json({ error: 'Erro ao carregar ativos da estratégia' });
  }
});

// Obter carteira (GET)
app.get('/api/carteira', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!user || error) return res.status(401).json({ error: 'Não autorizado' });

    // Buscar ID numérico do usuário na tabela usuarios
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
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
});

// Registrar compra na carteira (POST)
app.post('/api/carteira', async (req, res) => {
  try {
    // Autenticação e obtenção do usuário
    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!user || error) return res.status(401).json({ error: 'Não autorizado' });
    
    // Buscar o ID numérico do usuário na tabela "usuarios"
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
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
          data_compra: new Date().toISOString() // Atualiza a data de compra, se desejado
        })
        .eq('id', registro.id);
      
      if (updateError) throw updateError;
      return res.json({ message: 'Compra atualizada com sucesso', data: updateData });
    }
  } catch (error) {
    console.error('Erro na compra:', error);
    res.status(500).json({ error: 'Erro ao processar compra' });
  }
});


// Registrar venda (POST)
app.post('/api/vender', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!user || error) return res.status(401).json({ error: 'Não autorizado' });

    // Buscar o ID numérico do usuário na tabela "usuarios"
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
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
});




app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
