import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-api.assurassistancepro.org/api',
});

export default api;
