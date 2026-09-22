import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'inscription');
    }
  };

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez BananaShop et recevez 100 crédits pour bien commencer.">
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
            placeholder="Choisissez un nom d'utilisateur"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
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
            placeholder="Choisissez un mot de passe"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-primary btn-lg w-full">
          Créer mon compte
        </button>
      </form>

      <p className="mt-8 pt-6 border-t border-line text-center text-sm text-muted">
        Vous avez déjà un compte ?{' '}
        <Link to="/login" className="link">Se connecter</Link>
      </p>
    </AuthLayout>
  );
}
