import { useEffect, useRef, useState } from 'react';
import { IconLock, IconShield, IconUnlock } from './icons';
import './lock-screen.css';

// Écran de verrouillage, repris du Hacking QG (phases Kill Chain, Threat
// Model…) : même carte, même sceau, même champ « > mot de passe ». `verify`
// renvoie un booléen, éventuellement via une promesse, et lève en cas
// d'erreur réseau.
export default function LockScreen({
  command,
  verify,
  label,
  icon: Icon = IconShield,
  submitLabel = 'Déverrouiller',
  help,
  onUnlock,
  children,
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null); // message affiché, ou null
  const [checking, setChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const [opening, setOpening] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function fail(message) {
    setError(message);
    setShake(true);
    timer.current = setTimeout(() => setShake(false), 450);
  }

  async function submit(e) {
    e.preventDefault();
    if (opening || checking || !value) return;
    setChecking(true);
    try {
      const result = await verify(value);
      if (result) {
        // Le cadenas s'ouvre avant que la console n'apparaisse : un retour
        // visible que le mot de passe était le bon.
        setOpening(true);
        timer.current = setTimeout(() => onUnlock(result), 550);
      } else {
        setValue('');
        fail('Mot de passe incorrect. Réessaie.');
      }
    } catch {
      fail('Erreur de connexion au serveur.');
    } finally {
      setChecking(false);
    }
  }

  const Seal = opening ? IconUnlock : IconLock;

  return (
    <div className="lock">
      <section className={`lock-card${opening ? ' is-open' : ''}`} aria-labelledby="lock-title">
        <div className="lock-seal" aria-hidden="true">
          <Seal size={28} />
        </div>

        <p className="lock-cmd">
          <span className="lock-cmd-prompt">$</span> {command}
        </p>
        <h1 className="lock-title" id="lock-title">
          {opening ? 'Accès autorisé' : 'Accès restreint'}
        </h1>
        <p className="lock-desc">{children}</p>

        <form onSubmit={submit} className="lock-form">
          <label className={`cmd-input${error ? ' is-error' : ''}${shake ? ' lock-shake' : ''}`}>
            <span className="cmd-input-prompt">&gt;</span>
            <input
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="mot de passe"
              aria-label={`Mot de passe ${label}`}
              aria-invalid={Boolean(error)}
              aria-describedby="lock-help"
              autoComplete="current-password"
              spellCheck={false}
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn-primary btn-lg" disabled={opening || checking || !value}>
            <Icon size={15} /> {checking ? 'Vérification…' : submitLabel}
          </button>
        </form>

        <p id="lock-help" className={`lock-help${error ? ' is-error' : ''}`} role="status">
          {error || help}
        </p>
      </section>
    </div>
  );
}
