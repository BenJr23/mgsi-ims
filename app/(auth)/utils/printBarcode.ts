/**
 * Barcode Printing Utilities
 * Handles single, bulk, and multi-copy barcode printing
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  category: string;
  status: string;
}

/**
 * Generate HTML for bulk barcode printing (multiple products)
 */
export function generateBulkPrintHTML(
  products: Product[],
  selectedMap: Map<string, number>
): string {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulk Label Print</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
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
          grid-auto-rows: 1in;
          column-gap: 0.125in;
          row-gap: 0;
        }
        .label {
          width: 2.625in;
          height: 1in;
          padding: 0.05in 0.1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 1px dashed #cbd5e1;
          overflow: hidden;
        }
        .label-title {
          font-size: 8pt;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: center;
          margin-bottom: 2px;
        }
        .label-barcode {
          display: flex;
          justify-content: center;
        }
        .label-barcode svg {
          max-height: 0.45in;
          max-width: 2.4in;
        }
        .label-meta {
          display: flex;
          justify-content: space-between;
          width: 85%;
          font-size: 7pt;
          font-family: monospace;
          margin-top: 2px;
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
        <button class="print-btn" onclick="window.print()">Print Labels</button>
        <p style="margin-top: 8px; font-size: 14px; color: #475569;">
          Insert Avery 5160 (or compatible 30-up) label sheets. Ensure "Headers and footers" are unchecked and Scale is set to "Default" or 100%.
        </p>
      </div>
      <div class="sheet">
        <div class="labels-grid">
  `;

  selectedMap.forEach((quantity, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      for (let i = 0; i < quantity; i++) {
        html += `
          <div class="label">
            <div class="label-title">${product.name}</div>
            <div class="label-barcode">
              <svg id="barcode-${productId}-${i}"></svg>
            </div>
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
        document.querySelectorAll('svg[id^="barcode-"]').forEach(svg => {
          const id = svg.id;
          const productId = id.split('-')[1];
          const product = products.find(p => p.id === productId);
          if (product) {
            JsBarcode(svg, product.sku, {
              format: 'CODE128',
              width: 1.2,
              height: 30,
              margin: 0,
              displayValue: false,
              background: 'transparent',
              lineColor: '#000000'
            });
          }
        });
        
        setTimeout(() => { window.print(); }, 500);
      <\/script>
    </body>
    </html>
  `;

  return html;
}

/**
 * Print a single product barcode (2" x 1" thermal label)
 */
export function printSingleBarcode(product: Product): void {
  const printWindow = window.open('', '', 'width=400,height=400');
  if (!printWindow) {
    alert('Please allow pop-ups to print barcodes');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print - ${product.sku}</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
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
        .thermal-label {
          width: 2in;
          height: 1in;
          background: white;
          padding: 0.05in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .title {
          font-size: 7pt;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          margin-bottom: 2px;
        }
        .barcode-container svg {
          max-height: 0.45in;
          max-width: 1.8in;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          width: 90%;
          font-size: 6pt;
          font-family: monospace;
          margin-top: 2px;
        }
        @media print {
          @page {
            size: 2in 1in;
            margin: 0;
          }
          body { background: white; align-items: flex-start; }
          .thermal-label { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="thermal-label">
        <div class="title">${product.name}</div>
        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>
        <div class="meta">
          <span>${product.sku}</span>
          <span>${product.price}</span>
        </div>
      </div>
      <script>
        JsBarcode("#barcode", "${product.sku}", {
          format: "CODE128",
          width: 1,
          height: 30,
          margin: 0,
          displayValue: false,
          background: "#ffffff",
          lineColor: "#000000"
        });
        setTimeout(() => { window.print(); }, 300);
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print multiple copies of the same product barcode on A4 page
 */
export function printMultipleCopies(product: Product, quantity: number): void {
  if (!quantity || quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

  const printWindow = window.open('', '', 'width=1000,height=800');
  if (!printWindow) {
    alert('Please allow pop-ups to print barcodes');
    return;
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Print - ${product.name}</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
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
          grid-template-columns: repeat(4, 1fr);
          gap: 0.25in;
          align-content: start;
          page-break-after: always;
        }
        .barcode-label {
          width: 1.625in;
          background: white;
          border: 1px solid #d1d5db;
          padding: 0.1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }
        .product-name {
          font-size: 8pt;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .barcode-container {
          display: flex;
          justify-content: center;
          margin: 4px 0;
        }
        .barcode-container svg {
          max-width: 1.4in;
          height: auto;
        }
        .sku {
          font-size: 7pt;
          color: #6b7280;
          font-family: 'Courier New', monospace;
          margin-top: 2px;
          letter-spacing: 0.3px;
        }
        .price {
          font-size: 7pt;
          font-weight: bold;
          color: #1f2937;
          margin-top: 2px;
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
      <div class="barcode-label">
        <div class="product-name">${product.name}</div>
        <div class="barcode-container">
          <svg id="barcode-${i}"></svg>
        </div>
        <div class="sku">${product.sku}</div>
        <div class="price">${product.price}</div>
      </div>
    `;
  }

  html += `
      </div>
      <script>
        const product = ${JSON.stringify(product)};
        document.querySelectorAll('svg[id^="barcode-"]').forEach(svg => {
          JsBarcode(svg, product.sku, {
            format: 'CODE128',
            width: 1.5,
            height: 40,
            margin: 0,
            displayValue: false,
            background: '#ffffff',
            lineColor: '#000000'
          });
        });
        setTimeout(() => { window.print(); }, 400);
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
