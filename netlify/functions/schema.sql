CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price numeric(10,2) NOT NULL,
  calories int DEFAULT 0,
  img_url text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_code text DEFAULT '',
  table_no text,
  cart jsonb NOT NULL,
  total numeric(10,2) NOT NULL,
  customer jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
