const supabase = require('../supabase');

const getStrategies = async (req, res) => {
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
};

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
    console.error('Erro ao buscar ativos:', error);
    res.status(500).json({ error: 'Erro ao carregar ativos da estratégia' });
  }
};

module.exports = {
  getStrategies,
  getStrategyAssets
};
