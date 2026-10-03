import sharp from "sharp";

// Image de partage par défaut (1200 x 630) : la photo du logo complet
// (emblème, nom et slogan), recadrée au format des aperçus de liens.
// Source : scripts/print/logo-source.jpeg (1408 x 768).
const W = 1200;
const H = 630;
const SRC = "scripts/print/logo-source.jpeg";

const { width, height } = await sharp(SRC).metadata();
const cropH = Math.round((width * H) / W); // même proportion que 1200 x 630
await sharp(SRC)
  .extract({ left: 0, top: Math.round((height - cropH) / 2), width, height: cropH })
  .resize(W, H)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile("public/og-image.jpg");
console.log("public/og-image.jpg");
