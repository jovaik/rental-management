/**
 * Puppeteer launcher con @sparticuz/chromium para serverless
 * DEFINITIVO: Usa @sparticuz/chromium SIN opciones deprecadas
 * - NO incluir defaultViewport
 * - NO incluir headless
 * Estas causaban errores de "chromium bin does not exist"
 */

import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function launchBrowser() {
  console.log('🚀 [Puppeteer] Lanzando navegador con @sparticuz/chromium...');
  
  const browser = await puppeteerCore.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath()
  });
  
  console.log('✅ [Puppeteer] Navegador lanzado correctamente');
  return browser;
}
