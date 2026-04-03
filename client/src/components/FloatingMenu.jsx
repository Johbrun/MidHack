import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-16 right-0 w-56 bg-dark-light/95 backdrop-blur-md border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden mb-2 animate-fade-in">
          <Link
            to="/instructions"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-5 py-4 text-sm text-white/70 hover:bg-white/[0.05] hover:text-cyan transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Instructions CTF
          </Link>
          <Link
            to="/scoreboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-5 py-4 text-sm text-white/70 hover:bg-white/[0.05] hover:text-accent transition-all border-t border-white/[0.05]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            Classement
          </Link>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-cyan/20 transition-all duration-300 ${
          open
            ? 'bg-white/10 border border-white/20 rotate-45'
            : 'bg-cyan hover:bg-cyan/90 border border-cyan/50'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={open ? '#fff' : '#0E0B11'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  );
}
