const fs = require('fs');

const buf = fs.readFileSync('resources/MTDEditor.exe');
const str = buf.toString('ascii');
const matches = str.match(/[\x20-\x7E]{5,}/g);
if (matches) {
    fs.writeFileSync('mtd_strings.txt', matches.join('\n'));
    console.log("Wrote strings to mtd_strings.txt");
}
