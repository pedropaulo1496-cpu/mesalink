import path from "node:path";
import sharp from "sharp";

const androidRoot = process.argv[2];

if (!androidRoot) {
  throw new Error("Android project path is required.");
}

const projectRoot = path.resolve(androidRoot, "..");
const source = path.join(projectRoot, "public", "icons", "android-splash.svg");
const resourceRoot = path.join(androidRoot, "app", "src", "main", "res");

const densities = {
  "drawable-mdpi": 300,
  "drawable-hdpi": 450,
  "drawable-xhdpi": 600,
  "drawable-xxhdpi": 900,
  "drawable-xxxhdpi": 1200,
};

await Promise.all(
  Object.entries(densities).map(([directory, size]) =>
    sharp(source, { density: 384 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(resourceRoot, directory, "splash.png")),
  ),
);

console.log("Android splash resources updated.");
