import axios from 'axios';
import { showNudge } from './lib/nudge';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    // Message d'orientation renvoyé par le serveur (technique connue employée
    // au mauvais endroit) : sans ça il n'existe que dans le JSON, donc pour les
    // seuls participants qui passent par Burp.
    if (response.data?.nudge) showNudge(response.data.nudge);
    return response;
  },
  (error) => {
    if (error.response?.data?.nudge) showNudge(error.response.data.nudge);
    if (error.response?.status === 401) {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
