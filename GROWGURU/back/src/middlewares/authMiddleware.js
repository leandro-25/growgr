const supabase = require('../config/supabaseClient');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado: Token não fornecido' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Erro de autenticação Supabase:', error?.message);
      return res.status(401).json({ error: 'Não autorizado: Token inválido' });
    }

    req.user = user; // Anexa o objeto user à requisição
    next(); // Passa para o próximo middleware ou rota
  } catch (error) {
    console.error('Erro inesperado no middleware de autenticação:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

module.exports = authenticate;
