import { createContext, useContext, useEffect, useState } from 'react';

const UNLOCK_FLAG = 'ASY{L3t_5_H4cK_B4n4n45}';
const STORAGE_KEY = 'midhack_unlocked';
// Mode DEV (VITE_DEV_MODE=true dans le .env) : pas de modale d'onboarding
// bloquante, l'interface est déverrouillée d'office.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() =>
    DEV_MODE || localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const unlock = (flag) => {
    if (flag.trim() === UNLOCK_FLAG) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      return true;
    }
    return false;
  };

  // Déverrouillage automatique quand on arrive depuis le Hacking QG avec
  // le flag passé en query param (?unlock=ASY{...}). On nettoie ensuite
  // l'URL pour ne pas laisser traîner le flag.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('unlock');
    if (flag && unlock(flag)) {
      params.delete('unlock');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
      );
    }
  }, []);

  return (
    <OnboardingContext.Provider value={{ unlocked, unlock }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
