const supabase = require('../config/supabaseClient');

const login = async (req, res) => {
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
};

const signup = async (req, res) => {
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
};

module.exports = {
  login,
  signup,
};
