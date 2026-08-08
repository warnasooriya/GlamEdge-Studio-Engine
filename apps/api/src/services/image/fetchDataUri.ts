import axios from "axios";

export async function fetchImageDataUri(url: string): Promise<string | null> {
  try {
    const res = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer", timeout: 5000 });
    const contentType = (res.headers["content-type"] as string) || "image/png";
    const base64 = Buffer.from(res.data).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}
