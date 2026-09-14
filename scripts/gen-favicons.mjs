import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("public/favicon.svg");

const png16 = await sharp(svg).resize(16, 16).png().toBuffer();
const png32 = await sharp(svg).resize(32, 32).png().toBuffer();

await sharp(png32).toFile("public/favicon-32.png");
await sharp(svg).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(svg).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(svg).resize(512, 512).png().toFile("public/icon-512.png");

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
