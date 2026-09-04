import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const ALBUM_DIR = path.join(process.cwd(), "public", "assets", "album");
const IMAGE_RE = /\.(avif|jpe?g|png|webp|gif|svg)$/i;

export async function GET() {
  let files: string[] = [];
  try {
    files = (await readdir(ALBUM_DIR)).filter((file) => IMAGE_RE.test(file));
  } catch {
  }

  files.sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));

  const photos = files.map((file) => `/assets/album/${file}`);

  return Response.json({ count: photos.length, photos });
}
