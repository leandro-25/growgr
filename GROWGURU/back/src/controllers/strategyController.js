const supabase = require('../config/supabaseClient');

// @desc    Buscar todas as estratégias
// @route   GET /api/estrategias
// @access  Public
const getStrategies = async (req, res) => {
  try {
    const { data: estrategias, error: estrategiasError } = await supabase
      .from('estrategias')
      .select(`
        *,
        ativos:ranking_ativos (
          id,
          codigo_ativo,
          posicao,
          rentabilidade
        )
      `)
      .order('nome', { ascending: false });

    if (estrategiasError) throw estrategiasError;

    const estrategiasComContagem = estrategias.map(estrategia => ({
      ...estrategia,
      total_ativos: estrategia.ativos?.length || 0
    }));

    res.json(estrategiasComContagem);

  } catch (error) {
    console.error('Erro ao buscar estratégias:', error);
    res.status(500).json({ error: 'Erro ao carregar estratégias' });
  }
};

// @desc    Buscar ativos de uma estratégia específica
// @route   GET /api/estrategias/:id/ativos
// @access  Public
const getStrategyAssets = async (req, res) => {
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
    console.error('Erro ao buscar ativos da estratégia:', error);
    res.status(500).json({ error: 'Erro ao carregar ativos da estratégia' });
  }
};

module.exports = {
  getStrategies,
  getStrategyAssets,
};
