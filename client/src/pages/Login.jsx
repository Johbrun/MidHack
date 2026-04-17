import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NantesHackLogo } from '../lib/branding';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la connexion');
    }
  };

  return (
    <div className="page-container flex items-center justify-center min-h-screen">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-extrabold mb-2">Bon retour</h1>
          <p className="text-white/40 text-sm">Connectez-vous à votre compte BananaShop</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Nom d'utilisateur</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
            />
          </div>

          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Se connecter
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/40">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-cyan hover:text-cyan/80 transition-colors">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
