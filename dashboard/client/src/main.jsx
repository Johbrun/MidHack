import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminPage from './AdminPage';
import './index.css';

// Deux écrans, pas de routeur : le scoreboard projeté sur « / », la console
// d'administration sur « /admin » (le serveur renvoie index.html partout).
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminPage /> : <App />}
  </React.StrictMode>
);
