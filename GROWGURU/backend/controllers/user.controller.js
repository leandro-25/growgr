const supabase = require('../supabase');

const getUser = async (req, res) => {
  try {
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select('id, nome, email, saldo, created_at')
      .eq('user_id', req.user.id)
      .single();

    if (dbError) throw dbError;
    res.json(usuario);

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

module.exports = {
  getUser
};
