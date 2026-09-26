import { useAnnouncements } from '@shared/ui/serverEvents';

export default function AnnouncementBanner() {
  const [announcements, dismiss] = useAnnouncements();

  if (announcements.length === 0) return null;
  const latest = announcements[announcements.length - 1];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#1a1a2e', padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <span style={{ fontSize: '1.2rem' }}>📢</span>
      <span>{latest.message}</span>
      <button
        onClick={() => dismiss(latest.id)}
        style={{
          background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 4,
          color: '#1a1a2e', cursor: 'pointer', padding: '2px 8px', fontWeight: 'bold',
        }}
      >
        ✕
      </button>
    </div>
  );
}
