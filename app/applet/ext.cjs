const fs = require('fs');
console.log('hi');
const path = require('path');
const Seven = require('node-7z');
const sevenBin = require('7zip-bin');

const extract = (file, out) => {
  return new Promise((resolve) => {
    const stream = Seven.extractFull(file, out, {
      $bin: sevenBin.path7za
    });
    stream.on('end', () => {
      console.log('Extracted', file);
      resolve();
    });
    stream.on('error', (err) => {
      console.error('Error', file, err);
      resolve();
    });
  });
};

async function run() {
  await extract('resources/Mt_commandbar_MODIFICADO.rar', 'resources/modificado');
  await extract('resources/Mt_commandbar_MTDEditorModificadoBueno.rar', 'resources/bueno');
  await extract('resources/Mt_commandbar_ORIGINAL.rar', 'resources/original');
}
run();
