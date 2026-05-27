import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const LOCAL_CHROME_MAC =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function resolveExecutablePath(): Promise<string> {
  if (process.env.VERCEL) {
    return chromium.executablePath();
  }

  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    return process.env.CHROMIUM_EXECUTABLE_PATH;
  }

  try {
    return await chromium.executablePath();
  } catch {
    return LOCAL_CHROME_MAC;
  }
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const executablePath = await resolveExecutablePath();
  const onVercel = Boolean(process.env.VERCEL);

  const browser = await puppeteer.launch({
    args: onVercel ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const pdfUint8 = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
