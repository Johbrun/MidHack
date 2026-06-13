import { useEffect, useState } from 'react';

// Builds the Hacking QG feedback URL. In the docker deployment each team's
// site (BananaShop) and exploit-server (QG) sit on adjacent host ports
// (QG = site port + 1, same host), so we derive it from the current location
// — this keeps working for remote participants, unlike a hard-coded localhost.
// VITE_QG_URL can override it (e.g. in dev).
function qgBaseUrl() {
  const override = import.meta.env.VITE_QG_URL;
  if (override) return override.replace(/\/$/, '');
  const port = Number(window.location.port);
  if (!port) return null; // can't infer the QG port without an explicit one
  return `${window.location.protocol}//${window.location.hostname}:${port + 1}`;
}

// Full-screen lock displayed when the dashboard scoreboard is frozen.
// Listens to the SSE `freeze` events relayed by the BananaShop backend and
// blocks all interaction until the scoreboard is unfrozen (state is pushed in
// real time, so the lock lifts on its own). Invites participants to leave
// feedback on the Hacking QG while they wait.
export default function FreezeOverlay() {
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const es = new EventSource('/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'freeze') setFrozen(data.frozen);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  if (!frozen) return null;

  const qgBase = qgBaseUrl();

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'rgba(10, 12, 20, 0.92)',
        backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 24, gap: 16,
      }}
    >
      <div style={{ fontSize: '4rem', lineHeight: 1 }}>🧊</div>
      <h1 style={{ margin: 0, color: '#f59e0b', fontSize: '1.8rem' }}>CTF gelé</h1>
      <p style={{ margin: 0, maxWidth: 480, color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.5 }}>
        Le CTF est actuellement gelé par l'organisation. L'accès au site
        est suspendu jusqu'au dégel — la page se débloquera automatiquement.
      </p>
      {qgBase && (
        <>
          <p style={{ margin: 0, maxWidth: 480, color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            En attendant, profites-en pour exporter tes résultats ou nous dire ce
            que tu as pensé de l'événement&nbsp;!
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
            <a
              href={`${qgBase}/export`}
              style={{
                background: '#f59e0b', color: '#1a1a2e',
                padding: '10px 20px', borderRadius: 8,
                fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem',
              }}
            >
              Exporter mes résultats →
            </a>
            <a
              href={`${qgBase}/feedback`}
              style={{
                background: 'transparent', color: '#f59e0b',
                border: '1px solid #f59e0b',
                padding: '10px 20px', borderRadius: 8,
                fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem',
              }}
            >
              Laisser un feedback →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
