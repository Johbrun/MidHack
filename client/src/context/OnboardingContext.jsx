import { createContext, useContext, useEffect, useState } from 'react';
import { isUnlockFlag, isUnlockedAtStart, rememberUnlocked } from '@shared/ui/onboarding';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [unlocked, setUnlocked] = useState(isUnlockedAtStart);

  const unlock = (flag) => {
    if (isUnlockFlag(flag)) {
      rememberUnlocked();
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
