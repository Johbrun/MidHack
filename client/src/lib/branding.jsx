export const nantesHack = import.meta.env.VITE_NANTES_HACK === '1';

export function NantesHackLogo({ className = '' }) {
  if (!nantesHack) return null;
  return <img src="/nantes-hack.png" alt="Nantes@Hack" className={className} />;
}
