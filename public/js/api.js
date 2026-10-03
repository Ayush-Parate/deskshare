// API Client for DeskShare Coworking Platform

const API = (() => {
  const BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? '/api'
    : '/api';

  const TOKEN_KEY = 'deskshare_token';
  const USER_KEY = 'deskshare_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = options.headers || {};

    const token = getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid response from server'
      }));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (!err.status && err.message === 'Failed to fetch') {
        err.message = 'Cannot connect to backend server. Make sure it is running.';
      }
      throw err;
    }
  }

  return {
    getToken,
    getUser,
    setSession,
    clearSession,
    isAuthenticated: () => Boolean(getToken()),

    auth: {
      async login(email, password) {
        const res = await request('/auth/login', {
          method: 'POST',
          body: { email, password }
        });
        if (res.token && res.user) {
          setSession(res.token, res.user);
        }
        return res;
      },
      async register(name, email, password, role = 'user') {
        const res = await request('/auth/register', {
          method: 'POST',
          body: { name, email, password, role }
        });
        if (res.token && res.user) {
          setSession(res.token, res.user);
        }
        return res;
      },
      async getMe() {
        const res = await request('/auth/me');
        if (res.user) {
          const token = getToken();
          setSession(token, res.user);
        }
        return res;
      },
      logout() {
        clearSession();
      }
    },

    spaces: {
      getAll() {
        return request('/spaces');
      },
      search(keyword) {
        return request(`/spaces/search?keyword=${encodeURIComponent(keyword)}`);
      },
      getById(id) {
        return request(`/spaces/${id}`);
      },
      create(spaceData) {
        return request('/spaces', {
          method: 'POST',
          body: spaceData
        });
      },
      update(id, spaceData) {
        return request(`/spaces/${id}`, {
          method: 'PUT',
          body: spaceData
        });
      },
      delete(id) {
        return request(`/spaces/${id}`, {
          method: 'DELETE'
        });
      }
    },

    bookings: {
      getMy() {
        return request('/bookings');
      },
      getById(id) {
        return request(`/bookings/${id}`);
      },
      create(spaceId, startTime, endTime, notes = '') {
        return request('/bookings', {
          method: 'POST',
          body: { spaceId, startTime, endTime, notes }
        });
      },
      cancel(id) {
        return request(`/bookings/${id}`, {
          method: 'DELETE'
        });
      }
    },

    memberships: {
      getMy() {
        return request('/memberships/my');
      },
      purchase(plan, startDate = new Date().toISOString()) {
        return request('/memberships', {
          method: 'POST',
          body: { plan, startDate }
        });
      }
    }
  };
})();
