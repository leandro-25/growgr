const supabase = require('../config/supabaseClient');

// @desc    Buscar dados do usuário logado
// @route   GET /api/usuarios
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // O middleware de autenticação já validou o token e anexou o usuário a req.user
    const { user } = req;

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
};

module.exports = {
  getUserProfile,
};
