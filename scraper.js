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

    const firstUrl = `${category.category_url}?page=1`;
    await page.goto(firstUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const maxPage = await getTotalPages(page);
    console.log(`🔢 Всего страниц: ${maxPage}`);

    for (let pageNum = 1; pageNum <= maxPage; pageNum++) {
      const url = `${category.category_url}?page=${pageNum}`;
      console.log(`🌍 Страница: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const delayTime = randomInt(8000, 20000);
        console.log(`⏱ Ожидание перед загрузкой товаров: ${delayTime} мс`);
        await delay(delayTime);
        await page.waitForSelector('.styles_productCard__Qy_9h', { timeout: 15000 });
        await scrollUntilNoNewItems(page, '.styles_productCard__Qy_9h');
        console.log('↕ Прокрутка завершена');

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

        await delay(randomInt(2000, 5000));
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

async function scrollUntilNoNewItems(page, selector = '.styles_productCard__Qy_9h', pause = 1000, maxRounds = 15) {
  console.log('↕ Проверка полной загрузки товаров...');
  let previousCount = 0;

  for (let i = 0; i < maxRounds; i++) {
    const currentCount = await page.$$eval(selector, els => els.length);
    if (currentCount === previousCount) {
      console.log(`✅ Загрузка завершена. Карточек: ${currentCount}`);
      break;
    }
    console.log(`🔄 Карточек было: ${previousCount}, стало: ${currentCount}`);
    previousCount = currentCount;
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await delay(pause);
  }

  await delay(2000); // финальная пауза
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getTotalPages(page) {
  return await page.evaluate(() => {
    const paginationItems = Array.from(document.querySelectorAll('ul.styles_pagination__TCaLO a.styles_paginationItem__eSg3p'));
    const pageNumbers = paginationItems
      .map(el => parseInt(el.textContent.trim()))
      .filter(num => !isNaN(num));
    return pageNumbers.length ? Math.max(...pageNumbers) : 1;
  });
}

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
