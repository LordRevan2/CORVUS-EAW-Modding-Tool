const fs = require('fs');

if (fs.existsSync('new_mtd.mtd')) {
  const buf = fs.readFileSync('new_mtd.mtd');
  console.log("new_mtd.mtd HEX:", buf.slice(0, 16).toString('hex'));
}
if (fs.existsSync('test1.mtd')) {
  const buf2 = fs.readFileSync('test1.mtd');
  console.log("test1.mtd HEX:", buf2.slice(0, 16).toString('hex'));
}
