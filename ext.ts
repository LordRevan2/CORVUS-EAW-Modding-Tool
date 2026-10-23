import fs from 'fs';
import path from 'path';
import Seven from 'node-7z';
import sevenBin from '7zip-bin';

const extract = (file, outDir) => {
  return new Promise((resolve) => {
    // extract full to outDir
    const stream = Seven.extractFull(file, outDir, {
      $bin: sevenBin.path7za
    });
    stream.on('end', () => {
      console.log('Extracted', file, 'to', outDir);
      resolve(true);
    });
    stream.on('error', (err) => {
      console.error('Error', file, err);
      // Wait, let's see if 7z is working
      resolve(false);
    });
  });
};

async function run() {
  await extract('resources/Mt_commandbar_MODIFICADO.rar', 'resources/modificado');
  await extract('resources/Mt_commandbar_MTDEditorModificadoBueno.rar', 'resources/bueno');
  await extract('resources/Mt_commandbar_ORIGINAL.rar', 'resources/original');
  console.log("Done");
}
run();
