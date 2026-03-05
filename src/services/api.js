import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend.acareeracademy.com/api',
});

export default api;
