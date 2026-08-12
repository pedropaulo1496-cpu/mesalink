import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(scriptDir, "..", "public", "icons", "apps");

const variants = [
  {
    id: "restaurant",
    background: "#17130F",
    mesa: "#C8A56A",
    link: "#F4ECDF",
  },
  {
    id: "partners",
    background: "#E7D5B6",
    mesa: "#9B6F3B",
    link: "#17130F",
  },
  {
    id: "backoffice",
    background: "#315C4A",
    mesa: "#D7B267",
    link: "#F4ECDF",
  },
];

function svg(variant) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="${variant.background}" />
      <text x="256" y="268" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700" letter-spacing="-5">
        <tspan fill="${variant.mesa}">Mesa</tspan><tspan fill="${variant.link}">Link</tspan>
      </text>
    </svg>`;
}

await fs.mkdir(outputDir, { recursive: true });

for (const variant of variants) {
  const source = Buffer.from(svg(variant));
  await sharp(source).png().toFile(path.join(outputDir, `${variant.id}-512.png`));
  await sharp(source).resize(192, 192).png().toFile(path.join(outputDir, `${variant.id}-192.png`));
}

console.log(`Generated ${variants.length} MesaLink app icon families in ${outputDir}`);
