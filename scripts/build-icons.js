// Rasterizes public/icon.svg → PNG icons at all required sizes.
// Run with: npm run icons
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, "../public/icon.svg");
const outDir = resolve(__dirname, "../public");
const svgBuffer = readFileSync(svgPath);

mkdirSync(outDir, { recursive: true });

// Standard sizes used in the manifest and action.default_icon
const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Store icon: 96×96 artwork centered on a 128×128 transparent canvas.
// Chrome Web Store requires 128×128 with ~16px padding on each side.
const artwork = await sharp(svgBuffer).resize(96, 96).png().toBuffer();

await sharp({
  create: {
    width: 128,
    height: 128,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: artwork, left: 16, top: 16 }])
  .png()
  .toFile(resolve(outDir, "icon-store-128.png"));

console.log("✓ icon-store-128.png  (96×96 artwork, 16px transparent padding)");
