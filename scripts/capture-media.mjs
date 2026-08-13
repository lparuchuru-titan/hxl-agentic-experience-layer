import { chromium } from 'playwright';
import { mkdir, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const media = path.join(root, 'docs', 'media');
const port = process.env.PORT || '8766';
const base = `http://127.0.0.1:${port}`;

await mkdir(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const screenshotPage = await browser.newPage({
  viewport: { width: 720, height: 720 },
  deviceScaleFactor: 2
});
await screenshotPage.goto(`${base}/preview/capture.html`, { waitUntil: 'networkidle' });
await screenshotPage.locator('#card-root').screenshot({
  path: path.join(media, 'case-next-action.png')
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: media,
    size: { width: 1280, height: 720 }
  }
});
const demo = await context.newPage();
await demo.goto(`${base}/preview/demo.html`, { waitUntil: 'networkidle' });
await demo.waitForTimeout(8500);
await demo.close();
await context.close();
await browser.close();

const files = await readdir(media);
const webm = files.find((f) => f.endsWith('.webm'));
if (!webm) {
  throw new Error('Playwright did not write a webm recording');
}
await copyFile(path.join(media, webm), path.join(media, 'case-next-action-demo.webm'));
console.log('Wrote', path.join(media, 'case-next-action.png'));
console.log('Wrote', path.join(media, 'case-next-action-demo.webm'));
