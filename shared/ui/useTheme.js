import { useEffect, useState } from 'react';

// Thème du Hacking QG et du dashboard : nuit par défaut (ambiance console, et
// c'est aussi le thème à préférer au vidéoprojecteur), `html.light` pour le
// jour. Le choix est mémorisé, et partagé entre les deux outils sur un même
// hôte en dev.
export function useTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
