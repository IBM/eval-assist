const fs = require("fs");
const path = require("path");

const target = process.argv[2]; // frontend or backend
const basePath = path.join(__dirname, "../../shared/prisma/schema.base.prisma");
const generatorPath = path.join(
  __dirname,
  `../../${target}/prisma/generator.prisma`
);
const outputPath = path.join(__dirname, `../../${target}/prisma/schema.prisma`);

if (fs.existsSync(basePath) && fs.existsSync(generatorPath)) {
  const mergedContent =
    fs.readFileSync(generatorPath, "utf8") +
    "\n" +
    fs.readFileSync(basePath, "utf8");
  fs.writeFileSync(outputPath, mergedContent, "utf8");
  console.log(`✅ Prisma schema prepared for ${target}`);
} else {
  console.error(`❌ Missing Prisma files for ${target}`);
  process.exit(1);
}
