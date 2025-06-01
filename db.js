const fs = require('fs');
const Database = require('better-sqlite3');

const dbFile = 'scraper.db';
const db = new Database(dbFile);

if (!fs.existsSync(dbFile)) {
  const schema = fs.readFileSync('./schema.sql', 'utf8');
  db.exec(schema);
}

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO gallery_products (id, title, product_url, image_url, data_upload, category_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertPrice = db.prepare(`
  INSERT INTO gallery_product_prices (product_url, price, updated_at, category_id)
  VALUES (?, ?, ?, ?)
`);

const updateLastChecked = db.prepare(`
  UPDATE category_urls SET last_checked = ? WHERE id = ?
`);

const getActiveCategories = db.prepare(`
  SELECT * FROM category_urls WHERE is_active = 1
`);

module.exports = {
  db,
  insertProduct,
  insertPrice,
  updateLastChecked,
  getActiveCategories
};
