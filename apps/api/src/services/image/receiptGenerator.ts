import sharp from "sharp";
import { fetchImageDataUri } from "./fetchDataUri";

export interface ReceiptLineItem {
  name: string;
  price: number;
}

export interface ReceiptData {
  salonName: string;
  logoUrl?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  clientName: string;
  items: ReceiptLineItem[];
  total: number;
  paymentMode: string;
  issuedAt: Date;
}

const WIDTH = 600;
const PADDING = 36;
const HEADER_HEIGHT = 190;
const ITEM_ROW_HEIGHT = 34;
const BOTTOM_PADDING = 30;
const FONT = "Helvetica, Arial, sans-serif";

const COLORS = {
  brandStart: "#fb6f9c",
  brandEnd: "#d31e66",
  cream: "#fffaf5",
  plumDark: "#2f1729",
  plumMid: "#5b2f52",
  plumLight: "#7c4a72",
  gray: "#9a8a97",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateReceiptImage(data: ReceiptData): Promise<Buffer> {
  const logoDataUri = data.logoUrl ? await fetchImageDataUri(data.logoUrl) : null;

  // Lay out top-to-bottom with a running cursor so element gaps never overlap,
  // regardless of how many optional lines (address/contact/items) are present.
  let cursor = HEADER_HEIGHT + 42;

  const infoLines: string[] = [];
  if (data.address) {
    infoLines.push(
      `<text x="${WIDTH / 2}" y="${cursor}" text-anchor="middle" font-size="14" fill="${COLORS.plumMid}" font-family="${FONT}">${esc(data.address)}</text>`
    );
    cursor += 24;
  }
  if (data.contactPhone) {
    infoLines.push(
      `<text x="${WIDTH / 2}" y="${cursor}" text-anchor="middle" font-size="14" fill="${COLORS.plumMid}" font-family="${FONT}">Tel: ${esc(data.contactPhone)}</text>`
    );
    cursor += 24;
  }

  cursor += 12;
  const dividerY1 = cursor;
  cursor += 32;

  const billedToY = cursor;
  cursor += 34;

  const dashedDivider = (dy: number) =>
    `<line x1="${PADDING}" y1="${dy}" x2="${WIDTH - PADDING}" y2="${dy}" stroke="${COLORS.plumLight}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4" />`;

  const itemRows = data.items
    .map((item) => {
      const row = `
        <text x="${PADDING}" y="${cursor}" font-size="15" fill="${COLORS.plumDark}" font-family="${FONT}">${esc(item.name)}</text>
        <text x="${WIDTH - PADDING}" y="${cursor}" text-anchor="end" font-size="15" fill="${COLORS.plumDark}" font-family="${FONT}">LKR ${item.price.toFixed(2)}</text>`;
      cursor += ITEM_ROW_HEIGHT;
      return row;
    })
    .join("");

  cursor += 10;
  const dividerY2 = cursor;
  cursor += 42;

  const totalY = cursor;
  cursor += 36;

  const paymentY = cursor;
  cursor += 38;

  const footerDividerY = cursor;
  cursor += 34;

  const thankYouY = cursor;
  cursor += 24;

  const poweredByY = cursor;
  cursor += BOTTOM_PADDING;

  const height = cursor;

  const logoBlock = logoDataUri
    ? `<clipPath id="logoClip"><circle cx="${WIDTH / 2}" cy="70" r="46" /></clipPath>
       <circle cx="${WIDTH / 2}" cy="70" r="49" fill="white" opacity="0.9" />
       <image href="${logoDataUri}" xlink:href="${logoDataUri}" x="${WIDTH / 2 - 46}" y="24" width="92" height="92" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<circle cx="${WIDTH / 2}" cy="70" r="46" fill="white" opacity="0.15" />
       <text x="${WIDTH / 2}" y="80" text-anchor="middle" font-size="34" fill="white" font-family="${FONT}">✂</text>`;

  const svg = `
<svg width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.brandStart}" />
      <stop offset="100%" stop-color="${COLORS.brandEnd}" />
    </linearGradient>
    <clipPath id="cardClip"><rect x="0" y="0" width="${WIDTH}" height="${height}" rx="24" /></clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect x="0" y="0" width="${WIDTH}" height="${height}" fill="${COLORS.cream}" />
    <rect x="0" y="0" width="${WIDTH}" height="${HEADER_HEIGHT}" fill="url(#headerGrad)" />
    ${logoBlock}
    <text x="${WIDTH / 2}" y="150" text-anchor="middle" font-size="24" font-weight="700" fill="white" font-family="${FONT}">${esc(data.salonName)}</text>
    <text x="${WIDTH / 2}" y="174" text-anchor="middle" font-size="12" letter-spacing="1.5" fill="white" opacity="0.85" font-family="${FONT}">PAYMENT RECEIPT</text>

    ${infoLines.join("\n")}
    ${dashedDivider(dividerY1)}

    <text x="${PADDING}" y="${billedToY}" font-size="12" letter-spacing="1" fill="${COLORS.gray}" font-family="${FONT}">BILLED TO ${esc(data.clientName).toUpperCase()}</text>

    ${itemRows}

    ${dashedDivider(dividerY2)}

    <text x="${PADDING}" y="${totalY}" font-size="19" font-weight="700" fill="${COLORS.brandEnd}" font-family="${FONT}">Total</text>
    <text x="${WIDTH - PADDING}" y="${totalY}" text-anchor="end" font-size="19" font-weight="700" fill="${COLORS.brandEnd}" font-family="${FONT}">LKR ${data.total.toFixed(2)}</text>

    <text x="${PADDING}" y="${paymentY}" font-size="13" fill="${COLORS.gray}" font-family="${FONT}">Paid via ${esc(data.paymentMode)}</text>
    <text x="${WIDTH - PADDING}" y="${paymentY}" text-anchor="end" font-size="13" fill="${COLORS.gray}" font-family="${FONT}">${esc(data.issuedAt.toLocaleString())}</text>

    ${dashedDivider(footerDividerY)}

    <text x="${WIDTH / 2}" y="${thankYouY}" text-anchor="middle" font-size="15" font-weight="600" fill="${COLORS.plumDark}" font-family="${FONT}">Thank you for visiting!</text>
    <text x="${WIDTH / 2}" y="${poweredByY}" text-anchor="middle" font-size="11" fill="${COLORS.gray}" font-family="${FONT}">Powered by GlamEdge Studio Engine</text>
  </g>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
