import puppeteer from 'puppeteer';
import { authenticator } from 'otplib';
import fs from 'fs';
import 'dotenv/config'

const GITHUB_LOGIN_URL = 'https://github.com/login';
const GITHUB_EMAIL = process.env.GITHUB_EMAIL;
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD;
const SECRET_2FA = process.env.SECRET_2FA;

async function loginAndSaveCookies() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to login page
    await page.goto(GITHUB_LOGIN_URL);

    // Enter login details
    await page.type('#login_field', GITHUB_EMAIL);
    await page.type('#password', GITHUB_PASSWORD);
    

    // Submit the form
    await page.click('[name="commit"]');
    console.log('Login submitted');

    // Wait for 2FA input field and enter the 2FA code
    await page.waitForSelector('#app_totp');

    console.log('2FA code required');
    const twoFactorCode = authenticator.generate(SECRET_2FA);

    await page.type('#app_totp', twoFactorCode);
    console.log('2FA code entered');
    await page.click('[type="submit"]');
    console.log('2FA submitted');

    await page.waitForNavigation();

    // Save cookies to a file
    const cookies = await page.cookies();
    fs.writeFileSync('github-cookies.json', JSON.stringify(cookies, null, 2));

    // Close the browser
    await browser.close();
}

loginAndSaveCookies();
