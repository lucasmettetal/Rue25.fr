import { randomInt } from 'crypto';

export function generateRef(prefix = 'R25') {
  return `${prefix}-${randomInt(100000, 9999999)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

// Retire les retours à la ligne pour éviter toute injection d'en-tête email (CRLF injection)
export function stripHeaderChars(value) {
  return typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim() : value;
}

export function orderToJSON(o) {
  return {
    id: o.id,
    reference: o.reference,
    status: o.status,
    total: o.total,
    customer_name: o.customerName,
    email: o.customerEmail,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    items: (o.items || []).map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      size: i.size,
      quantity: i.quantity,
    })),
  };
}
