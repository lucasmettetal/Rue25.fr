import pool from './pool.js';

const schema = `
  CREATE TABLE IF NOT EXISTS admins (
    id         SERIAL PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL,
    category    TEXT NOT NULL,
    image_url   TEXT,
    in_stock    BOOLEAN DEFAULT TRUE,
    sizes       TEXT[],
    materials   TEXT[],
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS orders (
    id           SERIAL PRIMARY KEY,
    reference    TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    email        TEXT NOT NULL,
    total        NUMERIC(10,2) NOT NULL,
    status       TEXT NOT NULL DEFAULT 'nouveau'
                   CHECK (status IN ('nouveau','en cours','livré','annulé')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    price      NUMERIC(10,2) NOT NULL,
    size       TEXT,
    quantity   INT NOT NULL DEFAULT 1
  );

  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS products_updated_at ON products;
  CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS orders_updated_at ON orders;
  CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('✅ Migration terminée.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => { console.error('Migration échouée :', err); process.exit(1); });
