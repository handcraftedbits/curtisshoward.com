/*
 * Watches a file (or not) for changes.  If a change is detected, an HTTP server is started and a URL is accessed in
 * order to save a PDF of the changed file.
 */

const chokidar = require("chokidar");
const handler = require("serve-handler");
const http = require("http");
const httpShutdown = require("http-shutdown");
const puppeteer = require("puppeteer");
const rimraf = require("rimraf");
const yargs = require("yargs");

async function saveToPDF (url, filename) {
     process.stdout.write ("saving URL " + url + " to PDF file " + filename + "... ");

     try {
          // Disabling the sandbox isn't a great idea, but it does make things easier and we know exactly which page
          // we're going to access.

          const browser = await puppeteer.launch({
               args: [ "--disable-setuid-sandbox", "--no-sandbox" ],
               executablePath: "/usr/bin/google-chrome",
               headless: true
          });
          const page = await browser.newPage();

          await page.goto(url, {
               waitUntil: "networkidle0"
          });

          await page.pdf({
               format: "Letter",
               path: filename,
               preferCSSPageSize: true,
               printBackground: true
          });

          await browser.close();

          console.log("done");
     }

     catch (e) {
          console.error(e);
     }
}

const argv = yargs
     .usage("usage: $0 [options]")
     .alias("d", "docroot")
     .alias("h", "help")
     .alias("o", "output-file")
     .alias("r", "remove-files")
     .alias("u", "url")
     .alias("w", "watch-file")
     .describe("d", "the document root for the HTTP server")
     .describe("o", "the PDF file to output")
     .describe("r", "file(s) to remove after the PDF has been saved")
     .describe("u", "the URL (minus protocol, host, and port) to access in order to save the PDF")
     .describe("w", "the input file to watch")
     .string("d")
     .string("o")
     .string("r")
     .string("u")
     .string("w")
     .require("d")
     .require("o")
     .require("u")
     .help("h")
     .argv;
const server = httpShutdown(http.createServer((request, response) => {
     return handler(request, response, {
          public: argv.docroot
     });
}));

process.stdout.write("starting HTTP server... ");

server.listen(0, async () => {
     const url = "http://localhost:" + server.address().port + argv.url;

     console.log("started on port " + server.address().port);

     if (argv["watch-file"]) {
          console.log("watching file " + argv["watch-file"] + " for changes...");

          const watcher = chokidar.watch(argv["watch-file"]);

          watcher.on("add", async () => {
               console.log("file was added");

               await saveToPDF(url, argv["output-file"]);
          });
          watcher.on("change", async () => {
               console.log("file was changed");

               await saveToPDF(url, argv["output-file"]);
          });
     }

     else {
          await saveToPDF(url, argv["output-file"]);

          process.stdout.write("stopping HTTP server... ");

          server.shutdown(() => {
               console.log("done");

               if (argv["remove-files"]) {
                    process.stdout.write("removing file(s) '" + argv["remove-files"] + "'... ");

                    rimraf.sync(argv["remove-files"]);

                    console.log("done");
               }
          });
     }
});
