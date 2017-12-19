const chrome = require("simple-headless-chrome");

const browser = new chrome({ headless: true });

async function exportPDF (url, filename) {
     try {
          await browser.init();

          const newTab = await browser.newTab();

          await newTab.goTo(url);
          await newTab.savePdf(filename);
          await browser.close();
     }

     catch (e) {
          console.log(e);
     }
}

exportPDF(process.argv[2], process.argv[3]);
