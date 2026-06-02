import https from "https";
import fs from "fs";
https.get("https://focumentation.fandom.com/wiki/Story_Mode_and_Tutorial_Scripting_System", (res) => {
  let d = "";
  res.on("data", c => d+=c);
  res.on("end", () => fs.writeFileSync("wiki.html", d));
});
