import { createContext, useContext, useState } from 'react';

const UNLOCK_FLAG = 'ASY{L3t_5_H4cK_B4n4n45}';
const STORAGE_KEY = 'midhack_unlocked';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const unlock = (flag) => {
    if (flag.trim() === UNLOCK_FLAG) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      return true;
    }
    return false;
  };

  return (
    <OnboardingContext.Provider value={{ unlocked, unlock }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
