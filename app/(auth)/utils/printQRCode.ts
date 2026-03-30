/**
 * QR Code Printing Utilities
 * Handles bulk QR code label printing with product IDs
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  category: string;
  status: string;
}

const QR_LOGO_PATH = '/logo/GWlogo.webp';

const withProtocol = (url: string): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

export const resolveQrBaseUrl = (fallbackOrigin: string): string => {
  const configured = process.env.NEXT_PUBLIC_QR_BASE_URL?.trim();
  const rawBaseUrl = configured || fallbackOrigin;
  return withProtocol(rawBaseUrl).replace(/\/$/, '');
};

const buildProductUrl = (baseUrl: string, productId: string): string => {
  const normalized = baseUrl.replace(/\/$/, '');
  return `${normalized}/${productId}`;
};

export const getProductScanUrl = (productId: string, fallbackOrigin: string): string => {
  return buildProductUrl(resolveQrBaseUrl(fallbackOrigin), productId);
};


export const getQrLogoUrl = (baseUrl: string): string => {
  return new URL(QR_LOGO_PATH, withProtocol(baseUrl)).toString();
};

/**
 * Generate HTML for bulk QR code printing (multiple products with multiple copies)
 * QR codes encode a product link (e.g., https://your-domain/item/123)
 */
export function generateBulkPrintHTML(
  products: Product[],
  selectedMap: Map<string, number>,
  baseUrl: string
): string {
  const logoUrl = getQrLogoUrl(baseUrl);
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulk QR Label Print</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0;
          background: #cbd5e1;
        }
        .print-ui {
          text-align: center;
          padding: 20px;
          background: white;
          border-bottom: 1px solid #94a3b8;
          margin-bottom: 20px;
        }
        .print-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }
        .print-btn:hover { background: #1d4ed8; }
        
        .sheet {
          width: 8.5in;
          margin: 0 auto 20px auto;
          background: white;
          padding: 0.5in 0.1875in;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .labels-grid {
          display: grid;
          grid-template-columns: repeat(3, 2.625in);
          grid-auto-rows: 1.2in;
          column-gap: 0.125in;
          row-gap: 0.125in;
        }
        .label {
          width: 2.625in;
          height: 1.2in;
          padding: 0.08in 0.1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 1px dashed #cbd5e1;
          overflow: hidden;
          gap: 4px;
        }
        .label-qrcode {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .label-qrcode canvas {
          width: 0.78in;
          height: 0.78in;
        }
        .label-logo {
          width: 0.88in;
          height: 0.18in;
          object-fit: contain;
        }

        @media print {
          @page {
            size: letter;
            margin: 0;
          }
          body { background: white; }
          .print-ui { display: none; }
          .sheet {
            box-shadow: none;
            margin: 0;
            page-break-after: always;
          }
          .label { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-ui no-print">
        <button class="print-btn" onclick="window.print()">Print QR Labels</button>
        <p style="margin-top: 8px; font-size: 14px; color: #475569;">
          Insert Avery 5160 (or compatible label sheets). Ensure "Headers and footers" are unchecked and Scale is set to "Default" or 100%.
        </p>
      </div>
      <div class="sheet">
        <div class="labels-grid">
  `;

  selectedMap.forEach((quantity, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      for (let i = 0; i < quantity; i++) {
        const qrId = `qrcode-${productId}-${i}`;
        html += `
          <div class="label">
            <div class="label-qrcode">
              <canvas id="${qrId}" data-product-id="${product.id}" width="220" height="220"></canvas>
            </div>
            <img class="label-logo" src="${logoUrl}" alt="Great Work logo" />
          </div>
        `;
      }
    }
  });

  html += `
        </div>
      </div>
      <script>
        const products = ${JSON.stringify(products)};
        const baseUrl = ${JSON.stringify(baseUrl)};
        const logoUrl = ${JSON.stringify(logoUrl)};
        const qrStage = document.createElement('div');
        qrStage.style.position = 'absolute';
        qrStage.style.left = '-9999px';
        qrStage.style.top = '-9999px';
        document.body.appendChild(qrStage);

        const drawQrToCanvas = (targetCanvas, text, size) => {
          return new Promise((resolve) => {
          const holder = document.createElement('div');
          qrStage.appendChild(holder);

          new QRCode(holder, {
            text,
            width: size,
            height: size,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });

          const ctx = targetCanvas.getContext('2d');
          if (!ctx) {
            holder.remove();
            resolve();
            return;
          }

          const sourceCanvas = holder.querySelector('canvas');
          if (sourceCanvas) {
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
            holder.remove();
            resolve();
            return;
          }

          const sourceImage = holder.querySelector('img');
          if (sourceImage) {
            const drawImage = () => {
              ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
              ctx.drawImage(sourceImage, 0, 0, targetCanvas.width, targetCanvas.height);
              holder.remove();
              resolve();
            };
            if (sourceImage.complete) {
              drawImage();
            } else {
              sourceImage.onload = drawImage;
            }
            return;
          }

          holder.remove();
          resolve();
          });
        };
        
        const canvases = document.querySelectorAll('canvas[id^="qrcode-"]');
        const jobs = [];
        canvases.forEach(canvas => {
          const productId = canvas.dataset.productId;
          if (!productId) return;
          const product = products.find(p => p.id === productId);
          
          if (product) {
            jobs.push(drawQrToCanvas(canvas, baseUrl + '/' + product.id, 220));
          }
        });

        const logoJobs = Array.from(document.querySelectorAll('.label-logo')).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        });

        Promise.all([...jobs, ...logoJobs]).finally(() => {
          setTimeout(() => { window.print(); }, 300);
        });
      <\/script>
    </body>
    </html>
  `;

  return html;
}

/**
 * Print a single product QR code
 */
export function printSingleBarcode(product: Product): void {
  const productUrl = getProductScanUrl(product.id, window.location.origin);
  const logoUrl = getQrLogoUrl(window.location.origin);
  const printWindow = window.open('', '', 'width=400,height=400');
  if (!printWindow) {
    alert('Please allow pop-ups to print QR codes');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print - ${product.id}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #e2e8f0;
        }
        .label {
          width: 2.5in;
          height: 1.5in;
          background: white;
          padding: 0.1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          gap: 8px;
        }
        .qrcode-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .qrcode-container canvas {
          width: 1in;
          height: 1in;
        }
        .logo {
          width: 1.2in;
          height: 0.25in;
          object-fit: contain;
        }
        @media print {
          @page {
            size: 2.5in 1.5in;
            margin: 0;
          }
          body { background: white; align-items: flex-start; }
          .label { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="qrcode-container">
          <canvas id="qrcode" width="240" height="240"></canvas>
        </div>
        <img id="logo" class="logo" src="${logoUrl}" alt="Great Work logo" />
      </div>
      <script>
        const product = ${JSON.stringify(product)};
        const productUrl = ${JSON.stringify(productUrl)};
        const qrStage = document.createElement('div');
        qrStage.style.position = 'absolute';
        qrStage.style.left = '-9999px';
        qrStage.style.top = '-9999px';
        document.body.appendChild(qrStage);
        const holder = document.createElement('div');
        qrStage.appendChild(holder);
        
        new QRCode(holder, {
          text: productUrl,
          width: 180,
          height: 180,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
        
        const canvas = document.getElementById('qrcode');
        const logo = document.getElementById('logo');
        const sourceCanvas = holder.querySelector('canvas');
        const sourceImage = holder.querySelector('img');

        const waitForLogo = new Promise((resolve) => {
          if (!logo || logo.complete) {
            resolve();
            return;
          }
          logo.onload = () => resolve();
          logo.onerror = () => resolve();
        });

        const printWhenReady = () => {
          waitForLogo.finally(() => {
            setTimeout(() => { window.print(); }, 300);
          });
        };

        if (sourceCanvas && canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
            printWhenReady();
          }
          holder.remove();
        } else if (sourceImage && canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const drawImage = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
              printWhenReady();
              holder.remove();
            };
            if (sourceImage.complete) {
              drawImage();
            } else {
              sourceImage.onload = drawImage;
            }
          }
        } else {
          holder.remove();
          printWhenReady();
        }
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print multiple copies of the same product QR code on A4 page
 */
export function printMultipleCopies(product: Product, quantity: number): void {
  const productUrl = getProductScanUrl(product.id, window.location.origin);
  const logoUrl = getQrLogoUrl(window.location.origin);
  if (!quantity || quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

  const printWindow = window.open('', '', 'width=1000,height=800');
  if (!printWindow) {
    alert('Please allow pop-ups to print QR codes');
    return;
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Print - ${product.name}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: Arial, sans-serif; 
          background: #f3f4f6; 
          padding: 20px;
        }
        .print-preview {
          width: 8.5in;
          height: 11in;
          background: white;
          margin: 0 auto 20px;
          padding: 0.5in;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.3in;
          align-content: start;
          page-break-after: always;
        }
        .qr-label {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          overflow: hidden;
          gap: 6px;
          padding: 0.1in;
          border: 1px solid #d1d5db;
        }
        .qrcode-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .qrcode-container canvas {
          width: 1.15in;
          height: 1.15in;
        }
        .label-logo {
          width: 1.35in;
          height: 0.24in;
          object-fit: contain;
        }
        .controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: white;
          padding: 10px 15px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        .btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          font-size: 13px;
        }
        .btn:hover { 
          background: #1d4ed8; 
        }
        .info {
          color: #6b7280;
          font-size: 12px;
          text-align: center;
          margin-top: 5px;
        }
        @media print {
          @page {
            size: letter;
            margin: 0;
          }
          body { background: white; padding: 0; }
          .controls { display: none; }
          .print-preview {
            margin: 0;
            box-shadow: none;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button class="btn" onclick="window.print()">🖨️ Print</button>
        <div class="info">${quantity} labels</div>
      </div>
      <div class="print-preview">
  `;

  // Generate multiple copies
  for (let i = 0; i < quantity; i++) {
    html += `
      <div class="qr-label">
        <div class="qrcode-container">
          <canvas id="qrcode-${i}" width="260" height="260"></canvas>
        </div>
        <img class="label-logo" src="${logoUrl}" alt="Great Work logo" />
      </div>
    `;
  }

  html += `
      </div>
      <script>
        const product = ${JSON.stringify(product)};
        const productUrl = ${JSON.stringify(productUrl)};
        const logoUrl = ${JSON.stringify(logoUrl)};
        const qrStage = document.createElement('div');
        qrStage.style.position = 'absolute';
        qrStage.style.left = '-9999px';
        qrStage.style.top = '-9999px';
        document.body.appendChild(qrStage);

        const drawQrToCanvas = (targetCanvas, text, size) => {
          return new Promise((resolve) => {
          const holder = document.createElement('div');
          qrStage.appendChild(holder);

          new QRCode(holder, {
            text,
            width: size,
            height: size,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });

          const ctx = targetCanvas.getContext('2d');
          if (!ctx) {
            holder.remove();
            resolve();
            return;
          }

          const sourceCanvas = holder.querySelector('canvas');
          if (sourceCanvas) {
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
            holder.remove();
            resolve();
            return;
          }

          const sourceImage = holder.querySelector('img');
          if (sourceImage) {
            const drawImage = () => {
              ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
              ctx.drawImage(sourceImage, 0, 0, targetCanvas.width, targetCanvas.height);
              holder.remove();
              resolve();
            };
            if (sourceImage.complete) {
              drawImage();
            } else {
              sourceImage.onload = drawImage;
            }
            return;
          }

          holder.remove();
          resolve();
          });
        };

        const jobs = [];
        document.querySelectorAll('canvas[id^="qrcode-"]').forEach(canvas => {
          jobs.push(drawQrToCanvas(canvas, productUrl, 260));
        });

        const logoJobs = Array.from(document.querySelectorAll('.label-logo')).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        });

        Promise.all([...jobs, ...logoJobs]).finally(() => {
          setTimeout(() => { window.print(); }, 300);
        });
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
