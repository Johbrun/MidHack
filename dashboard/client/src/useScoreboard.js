import { useEffect, useRef, useState } from 'react';

// Connects to the dashboard WebSocket and exposes live scoreboard state,
// timer state, and an event stream (captures, hints, resets) for toasts.
export function useScoreboard() {
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState('Connexion...');
  const [online, setOnline] = useState(false);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const [events, setEvents] = useState([]); // { id, type, payload }
  const [config, setConfig] = useState({ hintPenalty: 3, eventTitle: 'BananaShop CTF' });
  const eventIdRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function pushEvent(type, payload) {
      eventIdRef.current += 1;
      const evt = { id: eventIdRef.current, type, payload };
      setEvents((prev) => [...prev, evt]);
    }

    function connect() {
      if (cancelled) return;
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);

      ws.onopen = () => {
        setOnline(true);
        setStatus('En direct');
      };

      ws.onclose = () => {
        setOnline(false);
        setStatus('Reconnexion...');
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'scoreboard') {
          setTeams(data.teams);
          if (data.config) setConfig(data.config);
        } else if (data.type === 'capture') {
          pushEvent('capture', data);
        } else if (data.type === 'hint') {
          pushEvent('hint', data);
        } else if (data.type === 'reset') {
          setTeams([]);
          pushEvent('reset', data);
        } else if (data.type === 'timer') {
          setTimerEndTime(data.running && data.endTime ? data.endTime : null);
        } else if (data.type === 'announcement') {
          pushEvent('announcement', data);
        } else if (data.type === 'freeze') {
          pushEvent('freeze', data);
        }
      };
    }

    // Initial timer load (same as the vanilla version did via fetch)
    fetch('/api/timer')
      .then((r) => r.json())
      .then((data) => {
        if (data.running && data.endTime) setTimerEndTime(data.endTime);
      })
      .catch(() => {});

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  function consumeEvent(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return { teams, status, online, timerEndTime, events, consumeEvent, config };
}
