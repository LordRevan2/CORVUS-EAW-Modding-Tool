import fs from 'fs';
import path from 'path';
import Seven from 'node-7z';
import sevenBin from '7zip-bin';

const extract = (file: string, out: string) => {
  return new Promise((resolve) => {
    const stream = Seven.extractFull(path.join('/app/applet', file), path.join('/app/applet', out), {
      $bin: sevenBin.path7za
    });
    stream.on('end', () => {
      console.log('Extracted', file);
      resolve(true);
    });
    stream.on('error', (err: any) => {
      console.error('Error', file, err);
      resolve(false);
    });
  });
};

async function run() {
  await extract('resources/Mt_commandbar_MODIFICADO.rar', 'resources/modificado');
  await extract('resources/Mt_commandbar_MTDEditorModificadoBueno.rar', 'resources/bueno');
  await extract('resources/Mt_commandbar_ORIGINAL.rar', 'resources/original');
}
run();
