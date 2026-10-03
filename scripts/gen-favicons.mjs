import sharp from "sharp";
import { writeFileSync } from "node:fs";

// Icônes générées à partir de l'emblème du logo (scripts/print/logo-emblem.png,
// découpé dans la photo du logo) : agrandi de 25 % et recadré au centre pour
// que le réseau et le « L » remplissent le carré, sur le fond noir du site.
const EMBLEM = "scripts/print/logo-emblem.png";
async function icon(n, zoom = 1.25) {
  const e = await sharp(EMBLEM).resize({ height: Math.round(n * zoom) }).png().toBuffer();
  const m = await sharp(e).metadata();
  const crop = await sharp(e)
    .extract({ left: Math.max(0, Math.round((m.width - n) / 2)), top: Math.max(0, Math.round((m.height - n) / 2)), width: Math.min(n, m.width), height: Math.min(n, m.height) })
    .png()
    .toBuffer();
  const c = await sharp(crop).metadata();
  return sharp({ create: { width: n, height: n, channels: 4, background: "#0a0a0a" } })
    .composite([{ input: crop, left: Math.round((n - c.width) / 2), top: Math.round((n - c.height) / 2) }])
    .png()
    .toBuffer();
}

const png16 = await icon(16);
const png32 = await icon(32);

await sharp(png32).toFile("public/favicon-32.png");
const compresse = { palette: true, quality: 92, effort: 10, compressionLevel: 9 };
await sharp(await icon(180)).png(compresse).toFile("public/apple-touch-icon.png");
await sharp(await icon(192)).png(compresse).toFile("public/icon-192.png");
await sharp(await icon(512)).png(compresse).toFile("public/icon-512.png");
// favicon.svg : l'icône 64 px intégrée, pour les navigateurs qui préfèrent le SVG.
const png64 = (await icon(64)).toString("base64");
writeFileSync("public/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image href="data:image/png;base64,${png64}" width="64" height="64"/></svg>
`);

// Hand-assemble a multi-resolution .ico (ICONDIR + PNG-compressed entries),
// since sharp/libvips has no native ICO writer.
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const dataChunks = [];
  let offset = 6 + count * 16;

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    dataChunks.push(data);
    offset += data.length;
  }

  return Buffer.concat([header, ...dirEntries, ...dataChunks]);
}

const ico = buildIco([
  { size: 16, data: png16 },
  { size: 32, data: png32 },
]);
writeFileSync("public/favicon.ico", ico);

console.log("done");
