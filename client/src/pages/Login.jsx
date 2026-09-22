import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

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
    <AuthLayout title="Bon retour parmi nous" subtitle="Connectez-vous pour retrouver votre panier et vos crédits.">
      {error && <div className="mb-6 alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="username">Nom d'utilisateur</label>
          <input
            id="username"
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Votre nom d'utilisateur"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn-dark btn-lg w-full">
          Se connecter
        </button>
      </form>

      <p className="mt-8 pt-6 border-t border-line text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link to="/register" className="link">Créer un compte</Link>
      </p>
    </AuthLayout>
  );
}
