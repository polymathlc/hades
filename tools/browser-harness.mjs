import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function withBrowser(callback) {
  const moduleName = process.env.PLAYWRIGHT_MODULE;
  const {chromium} = await import(moduleName ? pathToFileURL(moduleName).href : 'playwright');
  const html = await fs.readFile(path.join(root, 'index.html'));
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end(html);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true, ...(process.env.PLAYWRIGHT_BROWSER_CHANNEL ? {channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL} : {})});
    await callback({browser, url: `http://127.0.0.1:${server.address().port}`, root});
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

export async function preparePage(browser, options = {}) {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}, ...options});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // The game must remain usable with its system-font fallbacks and no external services.
  await page.route('https://fonts.**', route => route.abort());
  await page.addInitScript(() => {
    let seed = 1826;
    Math.random = () => ((seed = Math.imul(1664525, seed) + 1013904223 | 0) >>> 0) / 4294967296;
  });
  return {page, errors};
}
