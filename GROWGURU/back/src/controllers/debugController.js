const supabase = require('../config/supabaseClient');

// @desc    Verifica a estrutura da tabela e a conectividade
// @route   GET /api/check-table-structure
// @access  Public
const checkTableStructure = async (req, res) => {
  try {
    // Tenta obter as colunas da tabela usando uma consulta SQL direta
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'transacoes');

    if (columnsError) {
      return res.status(500).json({
        error: 'Erro ao obter estrutura da tabela',
        details: columnsError
      });
    }

    // Tenta inserir um registro de teste
    const testData = {
      usuario_id: 1, // ID de teste
      tipo: 'teste',
      valor: 100,
      descricao: 'Teste de estrutura',
      data: new Date().toISOString()
    };

    const columnNames = columns.map(col => col.column_name);
    if (columnNames.includes('codigo_ativo')) testData.codigo_ativo = 'TEST11';
    if (columnNames.includes('quantidade')) testData.quantidade = 10;
    if (columnNames.includes('valor_unitario')) testData.valor_unitario = 10;
    if (columnNames.includes('valor_total')) testData.valor_total = 100;

    const { data, error: insertError } = await supabase
      .from('transacoes')
      .insert([testData])
      .select();

    if (insertError) {
      return res.status(400).json({
        error: 'Erro ao inserir teste na tabela transacoes',
        details: insertError,
        tableStructure: columns
      });
    }

    // Remove o registro de teste
    if (data && data[0]?.id) {
      await supabase
        .from('transacoes')
        .delete()
        .eq('id', data[0].id);
    }

    res.json({
      success: true,
      message: 'Estrutura da tabela parece correta e a inserção funcionou.',
      testData: data,
      tableStructure: columns
    });

  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    res.status(500).json({
      error: 'Erro geral ao verificar estrutura da tabela',
      details: error.message
    });
  }
};

module.exports = {
  checkTableStructure,
};
