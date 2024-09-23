const puppeteer = require('puppeteer');
const fs = require('fs');


const readLinksFromFile = (fileName) => {
  return fs.readFileSync(fileName, 'utf-8').split('\n').filter(Boolean);
}


const extractHeadlines = async (page) => {
  return page.evaluate(() => {
    const headlines = [];
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5');

    for (const header of headers) {
      headlines.push({
        text: header.innerText,
        tag: header.tagName.toLowerCase() 
      });
    }

    return headlines;
  });
}

const run = async (fileName) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const links = readLinksFromFile(fileName);
  const headlinesByLink = {};

  for (const link of links) {
    console.log(`Analisando: ${link}`);
    await page.goto(link, { waitUntil: 'networkidle2' });
    const headlines = await extractHeadlines(page);
    headlinesByLink[link] = headlines;
  }

  await browser.close();

  const outputFileName = 'headlines.txt';
  const stream = fs.createWriteStream(outputFileName, { flags: 'w' });
  stream.once('open', () => {
    for (const [link, headlines] of Object.entries(headlinesByLink)) {
      stream.write(`Link: ${link}\n`);
      stream.write(`Cabeçalhos H1 a H5:\n`);
      headlines.forEach(headline => {
        stream.write(`- ${headline.tag.toUpperCase()}: ${headline.text}\n`); 
      });
      stream.write('\n');
    }
  });
};

run('links.txt');
