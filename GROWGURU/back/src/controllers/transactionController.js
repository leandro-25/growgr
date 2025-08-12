const supabase = require('../config/supabaseClient');

// @desc    Buscar todas as transações do usuário
// @route   GET /api/transacoes
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { user } = req; // Usuário vem do middleware

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
};

// @desc    Registrar uma nova transação
// @route   POST /api/transacoes
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const { user } = req; // Usuário vem do middleware
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
};

module.exports = {
  getTransactions,
  addTransaction,
};
