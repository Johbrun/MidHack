import { useEffect, useState } from 'react';

// Même convention que le Hacking QG : nuit par défaut, `html.light` pour le
// jour. C'est aussi le thème à préférer au vidéoprojecteur.
export function useTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(d => !d) };
}
