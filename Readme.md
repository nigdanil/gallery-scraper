# Gallery Scraper

Проект для сбора товаров с сайта [auchan.ru](https://www.auchan.ru) по заданным категориям. Использует Puppeteer для парсинга, SQLite для хранения данных, и поддерживает назначение товаров к категориям через UUID.

---

## ✨ Возможности

* Парсинг продуктов по категориям
* Сбор названия, цены, изображения и ссылки
* Сохранение в SQLite с привязкой к категории
* Обновление времени последней проверки категории

---

## ♻️ Установка

```bash
npm install
```

---

## 📂 Структура проекта

* `scraper.js` — основной парсер
* `db.js` — работа с базой данных SQLite
* `schema.sql` — SQL-структура таблиц
* `scraper.db` — файл базы данных (создаётся автоматически)

---

## 🌐 Создание базы данных

Создаётся автоматически при первом запуске, если `scraper.db` не существует.

Если нужно вручную:

```bash
sqlite3 scraper.db < schema.sql
```

---

## ✅ Добавление категории

```sql
INSERT INTO category_urls (id, name, category_url) VALUES
('uuid-1', 'Копчёные деликатесы', 'https://www.auchan.ru/catalog/...');
```

Чтобы временно отключить категорию:

```sql
UPDATE category_urls SET is_active = 0 WHERE id = 'uuid-1';
```

---

## ▶️ Запуск

```bash
node scraper.js
```

Браузер должен быть запущен в режиме удалённого подключения Puppeteer:

```bash
chrome --remote-debugging-port=9222
```

---

## 💾 Таблицы

### `category_urls`

| Поле          | Тип      | Описание               |
| ------------- | -------- | ---------------------- |
| id            | TEXT     | UUID категории         |
| name          | TEXT     | Название категории     |
| category\_url | TEXT     | URL страницы           |
| is\_active    | BOOLEAN  | Активна/неактивна      |
| last\_checked | DATETIME | Дата последнего обхода |

### `gallery_products`

| Поле         | Тип      | Описание              |
| ------------ | -------- | --------------------- |
| id           | TEXT     | UUID товара           |
| title        | TEXT     | Название              |
| product\_url | TEXT     | Ссылка на товар       |
| image\_url   | TEXT     | Ссылка на изображение |
| data\_upload | DATETIME | Когда добавлен        |
| is\_active   | BOOLEAN  | Активен ли            |
| category\_id | TEXT     | Привязка к категории  |

### `gallery_product_prices`

| Поле         | Тип      | Описание             |
| ------------ | -------- | -------------------- |
| id           | INTEGER  | Автоинкремент        |
| product\_url | TEXT     | Ссылка на товар      |
| price        | REAL     | Цена товара          |
| updated\_at  | DATETIME | Когда обновлено      |
| category\_id | TEXT     | Привязка к категории |

---

## 👍 Поддержка

Если что-то не работает — проверь схему БД и структуру кода. Все поля должны строго соответствовать.

---

© 2025 Gallery Scraper
