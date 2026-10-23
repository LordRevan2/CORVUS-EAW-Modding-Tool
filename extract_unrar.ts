import fs from 'fs';
import { createExtractorFromData } from 'node-unrar-js';

async function extractRar(filePath, outDir) {
  const buf = Uint8Array.from(fs.readFileSync(filePath)).buffer;
  const extractor = await createExtractorFromData({ data: buf });
  const { files } = extractor.extract({ files: (f) => true });
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of files) {
    if (file.fileHeader.flags.directory) continue;
    const dest = outDir + '/' + file.fileHeader.name;
    const destDir = dest.substring(0, dest.lastIndexOf('/'));
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(dest, file.extraction);
  }
}

async function run() {
  await extractRar('resources/Mt_commandbar_MODIFICADO.rar', 'resources/modificado');
  await extractRar('resources/Mt_commandbar_MTDEditorModificadoBueno.rar', 'resources/bueno');
  await extractRar('resources/Mt_commandbar_ORIGINAL.rar', 'resources/original');
  console.log("Done");
}

run().catch(console.error);
