import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicIconsDir = join(root, "public", "icons");
const assetsDir = join(root, "assets");

const colors = {
  bg: "#07090d",
  panel: "#111923",
  teal: "#21d2ad",
  tealSoft: "#4fe3c4",
  orange: "#f78c6b",
  text: "#f4f7fb",
};

function appIconSvg(size = 1024) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="230" fill="${colors.bg}"/>
  <circle cx="756" cy="222" r="270" fill="${colors.teal}" opacity="0.18"/>
  <circle cx="238" cy="814" r="250" fill="${colors.orange}" opacity="0.16"/>
  <rect x="150" y="148" width="724" height="724" rx="190" fill="${colors.panel}" stroke="rgba(255,255,255,0.1)" stroke-width="10"/>
  <path d="M306 643V383H430C498 383 545 423 545 486C545 552 498 592 429 592H388V643H306ZM388 524H421C448 524 464 510 464 487C464 465 448 451 421 451H388V524Z" fill="${colors.text}"/>
  <path d="M589 643V383H673V643H589Z" fill="${colors.text}"/>
  <path d="M268 686C326 728 407 752 512 752C617 752 698 728 756 686" stroke="${colors.teal}" stroke-width="40" stroke-linecap="round"/>
  <path d="M236 321H296M728 321H788" stroke="${colors.orange}" stroke-width="34" stroke-linecap="round"/>
</svg>`;
}

function iconForegroundSvg(size = 1024) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M306 643V383H430C498 383 545 423 545 486C545 552 498 592 429 592H388V643H306ZM388 524H421C448 524 464 510 464 487C464 465 448 451 421 451H388V524Z" fill="${colors.text}"/>
  <path d="M589 643V383H673V643H589Z" fill="${colors.text}"/>
  <path d="M268 686C326 728 407 752 512 752C617 752 698 728 756 686" stroke="${colors.teal}" stroke-width="40" stroke-linecap="round"/>
  <path d="M236 321H296M728 321H788" stroke="${colors.orange}" stroke-width="34" stroke-linecap="round"/>
</svg>`;
}

function iconBackgroundSvg(size = 1024) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${colors.bg}"/>
  <circle cx="756" cy="222" r="270" fill="${colors.teal}" opacity="0.18"/>
  <circle cx="238" cy="814" r="250" fill="${colors.orange}" opacity="0.16"/>
</svg>`;
}

function splashSvg(size = 2732) {
  const center = size / 2;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${colors.bg}"/>
  <circle cx="${center + 580}" cy="${center - 640}" r="760" fill="${colors.teal}" opacity="0.13"/>
  <circle cx="${center - 620}" cy="${center + 760}" r="720" fill="${colors.orange}" opacity="0.12"/>
  <g transform="translate(${center - 256} ${center - 360})">
    ${appIconSvg(512).replace(/<svg[^>]*>|<\/svg>/g, "")}
  </g>
  <text x="${center}" y="${center + 310}" text-anchor="middle" fill="${colors.text}" font-family="Segoe UI, Arial, sans-serif" font-size="118" font-weight="800">Personal IA</text>
  <text x="${center}" y="${center + 420}" text-anchor="middle" fill="#93a2b9" font-family="Segoe UI, Arial, sans-serif" font-size="46" font-weight="500">Seu personal trainer com IA no bolso</text>
</svg>`;
}

async function pngFromSvg(svg, path, size) {
  await mkdir(dirname(path), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path);
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content.trimStart(), "utf8");
}

await writeText(join(assetsDir, "brand-icon.svg"), appIconSvg());
await writeText(join(assetsDir, "brand-splash.svg"), splashSvg());
await writeText(
  join(root, "public", "manifest.webmanifest"),
  `${JSON.stringify(
    {
      name: "Personal IA",
      short_name: "Personal IA",
      description:
        "Treinos personalizados com IA, histórico de evolução e coach para adaptar sua rotina.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: colors.bg,
      theme_color: colors.teal,
      categories: ["health", "fitness", "lifestyle"],
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/icons/maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    null,
    2,
  )}\n`,
);

await pngFromSvg(appIconSvg(), join(assetsDir, "icon-only.png"), 1024);
await pngFromSvg(iconForegroundSvg(), join(assetsDir, "icon-foreground.png"), 1024);
await pngFromSvg(iconBackgroundSvg(), join(assetsDir, "icon-background.png"), 1024);
await pngFromSvg(splashSvg(), join(assetsDir, "splash.png"), 2732);
await pngFromSvg(splashSvg(), join(assetsDir, "splash-dark.png"), 2732);

await pngFromSvg(appIconSvg(), join(publicIconsDir, "icon-192.png"), 192);
await pngFromSvg(appIconSvg(), join(publicIconsDir, "icon-512.png"), 512);
await pngFromSvg(appIconSvg(), join(publicIconsDir, "maskable-512.png"), 512);

console.log("Assets de marca gerados com sucesso.");
