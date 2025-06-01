const puppeteer = require('puppeteer-core');
const { v4: uuidv4 } = require('uuid');
const {
  insertProduct,
  insertPrice,
  updateLastChecked,
  getActiveCategories
} = require('./db');

(async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const page = await browser.newPage();
  const categories = getActiveCategories.all();

  for (const category of categories) {
    console.log(`📂 Категория: ${category.name}`);
    const seenLinks = new Set();
    let pageNum = 1;

    while (true) {
      const url = `${category.category_url}?page=${pageNum}`;
      console.log(`🌍 Страница: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.styles_productCard__Qy_9h', { timeout: 30000 });
        await autoScroll(page);

        const products = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.styles_productCard__Qy_9h')).map(card => {
            const getText = sel => card.querySelector(sel)?.textContent?.trim() || '';
            const title = getText('.styles_productCardContentPanel_name__072Y7');
            const priceText = getText('.styles_productCardContentPanel_price__MqlWB').replace(/[^\d,]/g, '').replace(',', '.');
            const price = parseFloat(priceText);
            const image = card.querySelector('img.styles_picture_img__pdxYA')?.src || '';
            const linkSuffix = card.querySelector('a.styles_productCardPicturePanel__MFZe6')?.getAttribute('href') || '';
            const link = linkSuffix ? `https://www.auchan.ru${linkSuffix}` : '';

            if (!title || !link || isNaN(price)) return null;
            return { title, price, image, link };
          }).filter(Boolean);
        });

        if (products.length === 0 || products.every(p => seenLinks.has(p.link))) {
          console.log(`⛔ Конец. Собрано: ${seenLinks.size}`);
          break;
        }

        for (const product of products) {
          if (!seenLinks.has(product.link)) {
            const now = new Date().toISOString();
            insertProduct.run(uuidv4(), product.title, product.link, product.image, now, category.id);
            insertPrice.run(product.link, product.price, now, category.id);
            seenLinks.add(product.link);
          }
        }

        pageNum++;
        await delay(randomInt(2000, 4000));
      } catch (err) {
        console.error(`❌ Ошибка на странице: ${err.message}`);
        break;
      }
    }

    updateLastChecked.run(new Date().toISOString(), category.id);
  }

  await browser.close();
  console.log("✅ Парсинг завершён.");
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, Math.random() * 1000 + 1000);
    });
  });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
