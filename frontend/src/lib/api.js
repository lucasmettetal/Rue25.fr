const BASE = '/api';

function getAdminToken() {
  return localStorage.getItem('rue25_token');
}

function getCustomerToken() {
  return localStorage.getItem('rue25_user_token');
}

function authHeaders() {
  const token = getAdminToken() || getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function customerAuthHeaders() {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}

async function customerRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...customerAuthHeaders(), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}

// ── Admin auth ───────────────────────────────────────────────────────────────
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// ── Customer auth ────────────────────────────────────────────────────────────
export const registerCustomer = (data) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const loginCustomer = (email, password) =>
  request('/auth/customer/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () =>
  customerRequest('/auth/me');

export const getMyOrders = () =>
  customerRequest('/auth/my-orders');

// ── Products ─────────────────────────────────────────────────────────────────
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/products${qs ? '?' + qs : ''}`);
};
export const createProduct = (data) =>
  request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });

// ── Orders ───────────────────────────────────────────────────────────────────
export const placeOrder = (data) =>
  customerRequest('/orders', { method: 'POST', body: JSON.stringify(data) });
export const getOrders = () =>
  request('/orders');
export const getOrderStats = () =>
  request('/orders/stats');
export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ── Sur Mesure ───────────────────────────────────────────────────────────────
export const submitCustomOrder = (data) =>
  request('/custom-orders', { method: 'POST', body: JSON.stringify(data) });
export const getCustomOrders = () =>
  request('/custom-orders');
export const updateCustomOrderStatus = (id, status) =>
  request(`/custom-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ── Stripe ───────────────────────────────────────────────────────────────────
export const createCheckout = (data) =>
  customerRequest('/stripe/checkout', { method: 'POST', body: JSON.stringify(data) });
export const verifyPayment = (sessionId) =>
  request(`/stripe/verify/${sessionId}`);
