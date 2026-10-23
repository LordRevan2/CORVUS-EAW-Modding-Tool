const fs = require('fs');

if (fs.existsSync('test1.mtd')) {
  const buf = fs.readFileSync('test1.mtd');
  const text = new TextDecoder('ascii').decode(buf.slice(0, 4));
  console.log("test1.mtd:", text);
} else {
  console.log("no test1.mtd");
}

if (fs.existsSync('new_mtd.mtd')) {
  const buf2 = fs.readFileSync('new_mtd.mtd');
  const text2 = new TextDecoder('ascii').decode(buf2.slice(0, 4));
  console.log("new_mtd.mtd:", text2);
} else {
  console.log("no new_mtd.mtd");
}
