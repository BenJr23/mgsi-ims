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

/**
 * Generate HTML for bulk QR code printing (multiple products with multiple copies)
 * QR codes encode a product link (e.g., https://your-domain/item/123)
 */
export function generateBulkPrintHTML(
  products: Product[],
  selectedMap: Map<string, number>,
  baseUrl: string
): string {
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
        .label-title {
          font-size: 8pt;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: center;
        }
        .label-qrcode {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .label-qrcode canvas,
        .label-qrcode img {
          width: 0.85in;
          height: 0.85in;
        }
        .label-id {
          font-size: 9pt;
          font-weight: bold;
          text-align: center;
          color: #1f2937;
          letter-spacing: 0.5px;
        }
        .label-meta {
          display: flex;
          justify-content: space-between;
          width: 90%;
          font-size: 6pt;
          font-family: monospace;
          text-align: center;
          gap: 4px;
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
            <div class="label-title">${product.name}</div>
            <div class="label-qrcode">
              <canvas id="${qrId}" data-product-id="${product.id}" width="220" height="220"></canvas>
            </div>
            <div class="label-id">ID: ${product.id}</div>
            <div class="label-meta">
              <span>${product.sku}</span>
              <span>${product.price}</span>
            </div>
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
        const qrStage = document.createElement('div');
        qrStage.style.position = 'absolute';
        qrStage.style.left = '-9999px';
        qrStage.style.top = '-9999px';
        document.body.appendChild(qrStage);

        const drawQrToCanvas = (targetCanvas, text, size) => {
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
            return;
          }

          const sourceCanvas = holder.querySelector('canvas');
          if (sourceCanvas) {
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
            holder.remove();
            return;
          }

          const sourceImage = holder.querySelector('img');
          if (sourceImage) {
            const drawImage = () => {
              ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
              ctx.drawImage(sourceImage, 0, 0, targetCanvas.width, targetCanvas.height);
              holder.remove();
            };
            if (sourceImage.complete) {
              drawImage();
            } else {
              sourceImage.onload = drawImage;
            }
            return;
          }

          holder.remove();
        };
        
        const canvases = document.querySelectorAll('canvas[id^="qrcode-"]');
        canvases.forEach(canvas => {
          const productId = canvas.dataset.productId;
          if (!productId) return;
          const product = products.find(p => p.id === productId);
          
          if (product) {
            drawQrToCanvas(canvas, baseUrl + '/' + product.id, 220);
          }
        });
        
        setTimeout(() => { window.print(); }, 800);
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
        .title {
          font-size: 9pt;
          font-weight: bold;
          color: #1f2937;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
        .product-id {
          font-size: 10pt;
          font-weight: bold;
          color: #000;
          letter-spacing: 0.5px;
        }
        .meta {
          font-size: 7pt;
          color: #6b7280;
          font-family: monospace;
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
        <div class="title">${product.name}</div>
        <div class="qrcode-container">
          <canvas id="qrcode" width="240" height="240"></canvas>
        </div>
        <div class="product-id">ID: ${product.id}</div>
        <div class="meta">${product.sku} | ${product.price}</div>
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
        const sourceCanvas = holder.querySelector('canvas');
        const sourceImage = holder.querySelector('img');

        if (sourceCanvas && canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
          }
          holder.remove();
        } else if (sourceImage && canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const drawImage = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
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
        }
        
        setTimeout(() => { window.print(); }, 300);
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
        .product-name {
          font-size: 8pt;
          font-weight: bold;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
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
        .product-id {
          font-size: 9pt;
          font-weight: bold;
          color: #000;
          letter-spacing: 0.3px;
        }
        .sku {
          font-size: 6pt;
          color: #6b7280;
          font-family: 'Courier New', monospace;
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
        <div class="product-name">${product.name}</div>
        <div class="qrcode-container">
          <canvas id="qrcode-${i}" width="260" height="260"></canvas>
        </div>
        <div class="product-id">ID: ${product.id}</div>
        <div class="sku">${product.sku} | ${product.price}</div>
      </div>
    `;
  }

  html += `
      </div>
      <script>
        const product = ${JSON.stringify(product)};
        const productUrl = ${JSON.stringify(productUrl)};
        const qrStage = document.createElement('div');
        qrStage.style.position = 'absolute';
        qrStage.style.left = '-9999px';
        qrStage.style.top = '-9999px';
        document.body.appendChild(qrStage);

        const drawQrToCanvas = (targetCanvas, text, size) => {
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
            return;
          }

          const sourceCanvas = holder.querySelector('canvas');
          if (sourceCanvas) {
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
            holder.remove();
            return;
          }

          const sourceImage = holder.querySelector('img');
          if (sourceImage) {
            const drawImage = () => {
              ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
              ctx.drawImage(sourceImage, 0, 0, targetCanvas.width, targetCanvas.height);
              holder.remove();
            };
            if (sourceImage.complete) {
              drawImage();
            } else {
              sourceImage.onload = drawImage;
            }
            return;
          }

          holder.remove();
        };
        
        document.querySelectorAll('canvas[id^="qrcode-"]').forEach(canvas => {
          drawQrToCanvas(canvas, productUrl, 260);
        });
        
        setTimeout(() => { window.print(); }, 800);
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

