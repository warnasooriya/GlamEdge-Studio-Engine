import QRCode from "qrcode";
import sharp from "sharp";
import { fetchImageDataUri } from "./fetchDataUri";

export interface SalonQrCardData {
  salonName: string;
  logoUrl?: string | null;
  publicUrl: string;
}

const WIDTH = 720;
const HEADER_HEIGHT = 210;
const QR_SIZE = 420;
const QR_PANEL_PADDING = 30;
const QR_PANEL_SIZE = QR_SIZE + QR_PANEL_PADDING * 2;
const FONT = "Helvetica, Arial, sans-serif";

const COLORS = {
  brandStart: "#fb6f9c",
  brandEnd: "#d31e66",
  cream: "#fffaf5",
  plumDark: "#2f1729",
  plumMid: "#5b2f52",
  gray: "#9a8a97",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

async function buildQrDataUri(publicUrl: string): Promise<string> {
  const buffer = await QRCode.toBuffer(publicUrl, {
    type: "png",
    width: QR_SIZE,
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: COLORS.plumDark, light: "#ffffff" },
  });
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

// A branded "share card" rather than a bare QR code — the logo and salon name
// stay plainly visible (not squeezed into the QR itself, which would risk scan
// reliability once WhatsApp recompresses the image) so the same PNG doubles as
// marketing collateral: postable as-is, or printed for a counter/table card.
export async function generateSalonQrCard(data: SalonQrCardData): Promise<Buffer> {
  const [logoDataUri, qrDataUri] = await Promise.all([
    data.logoUrl ? fetchImageDataUri(data.logoUrl) : Promise.resolve(null),
    buildQrDataUri(data.publicUrl),
  ]);

  const salonName = esc(truncate(data.salonName, 32));
  const publicUrlDisplay = esc(data.publicUrl.replace(/^https?:\/\//, ""));

  const logoCenterY = HEADER_HEIGHT;
  const logoRadius = 54;

  let cursor = logoCenterY + logoRadius + 38;
  const salonNameY = cursor;
  cursor += 34;

  const taglineY = cursor;
  cursor += 50;

  const qrPanelX = (WIDTH - QR_PANEL_SIZE) / 2;
  const qrPanelY = cursor;
  cursor += QR_PANEL_SIZE + 44;

  const urlY = cursor;
  cursor += 40;

  const dividerY = cursor;
  cursor += 34;

  const footerY = cursor;
  cursor += 30;

  const height = cursor;

  const logoBlock = logoDataUri
    ? `<clipPath id="logoClip"><circle cx="${WIDTH / 2}" cy="${logoCenterY}" r="${logoRadius - 4}" /></clipPath>
       <circle cx="${WIDTH / 2}" cy="${logoCenterY}" r="${logoRadius}" fill="white" />
       <image href="${logoDataUri}" xlink:href="${logoDataUri}" x="${WIDTH / 2 - (logoRadius - 4)}" y="${logoCenterY - (logoRadius - 4)}" width="${(logoRadius - 4) * 2}" height="${(logoRadius - 4) * 2}" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<circle cx="${WIDTH / 2}" cy="${logoCenterY}" r="${logoRadius}" fill="white" />
       <text x="${WIDTH / 2}" y="${logoCenterY + 14}" text-anchor="middle" font-size="42" font-family="${FONT}">✂</text>`;

  const svg = `
<svg width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.brandStart}" />
      <stop offset="100%" stop-color="${COLORS.brandEnd}" />
    </linearGradient>
    <clipPath id="cardClip"><rect x="0" y="0" width="${WIDTH}" height="${height}" rx="28" /></clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect x="0" y="0" width="${WIDTH}" height="${height}" fill="${COLORS.cream}" />
    <rect x="0" y="0" width="${WIDTH}" height="${HEADER_HEIGHT}" fill="url(#headerGrad)" />
    <text x="${WIDTH / 2}" y="48" text-anchor="middle" font-size="13" letter-spacing="2.5" fill="white" opacity="0.85" font-family="${FONT}">SCAN TO VISIT US</text>

    ${logoBlock}

    <text x="${WIDTH / 2}" y="${salonNameY}" text-anchor="middle" font-size="30" font-weight="700" fill="${COLORS.plumDark}" font-family="${FONT}">${salonName}</text>
    <text x="${WIDTH / 2}" y="${taglineY}" text-anchor="middle" font-size="14" fill="${COLORS.gray}" font-family="${FONT}">Book appointments, browse services &amp; our portfolio</text>

    <rect x="${qrPanelX}" y="${qrPanelY}" width="${QR_PANEL_SIZE}" height="${QR_PANEL_SIZE}" rx="24" fill="white" stroke="${COLORS.brandStart}" stroke-opacity="0.18" stroke-width="2" />
    <image href="${qrDataUri}" xlink:href="${qrDataUri}" x="${qrPanelX + QR_PANEL_PADDING}" y="${qrPanelY + QR_PANEL_PADDING}" width="${QR_SIZE}" height="${QR_SIZE}" />

    <text x="${WIDTH / 2}" y="${urlY}" text-anchor="middle" font-size="15" font-weight="600" fill="${COLORS.brandEnd}" font-family="${FONT}">${publicUrlDisplay}</text>

    <line x1="60" y1="${dividerY}" x2="${WIDTH - 60}" y2="${dividerY}" stroke="${COLORS.plumMid}" stroke-width="1" stroke-dasharray="4 4" opacity="0.25" />

    <text x="${WIDTH / 2}" y="${footerY}" text-anchor="middle" font-size="11" fill="${COLORS.gray}" font-family="${FONT}">Powered by GlamEdge Studio Engine</text>
  </g>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
