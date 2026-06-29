// Cliente de API para conectar con las Netlify Functions redirigidas bajo /api
const API_BASE = '/api';

// Configuración de Supabase dinámica
let configPromise = null;
window.getSupabaseConfig = function() {
  if (!configPromise) {
    configPromise = fetch(`${API_BASE}/config`)
      .then(res => res.json())
      .then(data => {
        window.__ENV__ = data;
        return data;
      })
      .catch(err => {
        console.error('Error al obtener la configuración de la API:', err);
        return { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
      });
  }
  return configPromise;
};

// Genera la URL pública para archivos subidos en Supabase Storage
window.getFileUrl = function(fileName) {
  if (!fileName) return '';
  const url = window.__ENV__?.SUPABASE_URL;
  if (!url) return '';
  return `${url}/storage/v1/object/public/uploads/${fileName}`;
};


const api = {
  // Obtener headers con JWT si existe
  getHeaders(isMultipart = false) {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async handleResponse(response) {
    if (response.status === 401) {
      // Si es un error de inicio de sesión, no forzar cierre de sesión / redirección
      if (response.url && response.url.includes('/auth-login')) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Usuario o contraseña incorrectos.');
      }
      
      // Token expirado o inválido, redirigir al login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#login';
      throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error en la solicitud.');
      }
      return data;
    } else {
      // Para descargas como Excel
      if (!response.ok) {
        throw new Error('Error al descargar el archivo.');
      }
      return response;
    }
  },

  async get(path) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  },

  async post(path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    return this.handleResponse(response);
  },

  async put(path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    return this.handleResponse(response);
  },

  async del(path) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  },

  // Helper para envío de archivos/imágenes
  async upload(path, formData) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData
    });
    return this.handleResponse(response);
  }
};

window.api = api;
