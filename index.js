import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { downloadFile, reconstructSource } from './utils.js';

async function scrapeFiles(url) {
    const downloadDirectory = './downloaded';
    const reconstructedSourceDirectory = './reconstructed';

    fs.mkdirSync(downloadDirectory, { recursive: true });
    fs.mkdirSync(reconstructedSourceDirectory, { recursive: true });

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {
        const url = interceptedRequest.url();
        interceptedRequest.continue(); // Always allow requests to continue.
    });

    page.on('response', async response => {
        const url = response.url();
        const status = response.status();
        // Check for ok status and if response is a JavaScript file
        if ((status === 200 || status === 304) /* && url.endsWith('.js') */) {
            try {
                const filename = path.basename(url);
                const parsedUrl = new URL(url);
                const host = parsedUrl.host;
                const filepath = `./downloaded/${host}/compiled/${filename}`;
                console.log(`Downloading JS: dowloadFile(${url}, ${filepath})`);
                await downloadFile(url, filepath);
                console.log(`Downloaded JS: ${filename}`);

                // Attempt to fetch the source map
                console.log(`Attempting to download source map: ${url}`);
                response.text().then(async jsContent => {
                    // Checking for sourceMappingURL comment at the end of the file
                    const sourceMapComment = jsContent.match(/\/\/# sourceMappingURL=([^\s]+)/);
                    if (sourceMapComment) {
                        const sourceMapURL = new URL(sourceMapComment[1], url).toString();
                        const sourceMapFilename = path.basename(sourceMapURL);
                        const sourceMapFilepath = `./downloaded/${host}/source-maps/${sourceMapFilename}`;

                        await downloadFile(sourceMapURL, sourceMapFilepath);
                        console.log(`Downloaded Source Map: ${sourceMapFilename}`);

                        // Reconstruct the source file
                        console.log(`Reconstructing source file: ${filepath}`);
                        console.log(`reconstructSource("${filepath}", "${sourceMapFilepath}", "${reconstructedSourceDirectory}")`);
                        await reconstructSource(filepath, sourceMapFilepath, reconstructedSourceDirectory);
                    }
                });

            } catch (error) {
                console.error(`Failed to download script or source map from: ${url}`, error);
            }
        }
    });

    // Navigate to the desired page
    await page.goto(url, { waitUntil: 'networkidle0' }); // Replace with your target URL

    await browser.close();
};

scrapeFiles("https://github.com");

