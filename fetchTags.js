import fs from 'fs';

async function fetchTags() {
    const res = await fetch('https://focumentation.fandom.com/wiki/XML_Tags');
    const text = await res.text();
    fs.writeFileSync('tags.html', text);
    console.log('done');
}
fetchTags();
