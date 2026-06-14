import { randomInt } from 'crypto';

export function generateRef(prefix = 'R25') {
  return `${prefix}-${randomInt(10000, 99999)}`;
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
