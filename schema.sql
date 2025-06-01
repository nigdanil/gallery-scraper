CREATE TABLE IF NOT EXISTS category_urls (
    id TEXT PRIMARY KEY,
    name TEXT,
    category_url TEXT UNIQUE,
    is_active BOOLEAN DEFAULT 1,
    last_checked DATETIME
);

CREATE TABLE IF NOT EXISTS gallery_products (
    id TEXT PRIMARY KEY,
    title TEXT,
    product_url TEXT UNIQUE,
    image_url TEXT,
    data_upload DATETIME,
    is_active BOOLEAN DEFAULT 1,
    category_id TEXT
);

CREATE TABLE IF NOT EXISTS gallery_product_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_url TEXT,
    price REAL,
    updated_at DATETIME,
    category_id TEXT
);
