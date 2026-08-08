import QRCode from "qrcode";

export function generateSalonQrCode(publicUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(publicUrl, {
    type: "png",
    width: 640,
    margin: 2,
    color: { dark: "#2f1729", light: "#fffaf5" },
  });
}
