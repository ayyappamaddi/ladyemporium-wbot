const puppeteer = require('puppeteer-core');
const _cliProgress = require('cli-progress');
const spintax = require('mel-spintax');
require("./welcome");
var spinner = require("./step");
var utils = require("./utils");
var qrcode = require('qrcode-terminal');
var path = require("path");
var argv = require('yargs').argv;
var rev = require("./detectRev");
var constants = require("./constants");
var configs = require("../bot");
var settings = require('./settings');
var fs = require("fs");

//console.log(ps);

//console.log(process.cwd());

async function Main() {

    try {
        //console.log(configs);
        var page;
        await downloadAndStartThings();
        // var isLogin = await checkLogin();
        // if (!isLogin) {
        //     await getAn
        //     dShowQR();
        // }
        // if (configs.smartreply.suggestions.length > 0) {
        //     await setupSmartReply();
        // }
        global.page = page;
        page.on('dialog', async dialog => {
            await dialog.accept();
        });
        console.log("WBOT is ready !! Let those message come.");
    } catch (e) {
        console.error("\nLooks like you got an error. " + e);
        try {
            page.screenshot({ path: path.join(process.cwd(), "error.png") })
        } catch (s) {
            console.error("Can't create shreenshot, X11 not running?. " + s);
        }
        console.warn(e);
        console.error("Don't worry errors are good. They help us improve. A screenshot has already been saved as error.png in current directory. Please mail it on vasani.arpit@gmail.com along with the steps to reproduce it.\n");
        throw e;
    }

    /**
     * If local chrome is not there then this function will download it first. then use it for automation. 
     */
    async function downloadAndStartThings() {
        let botjson = utils.externalInjection("bot.json");
        var appconfig = await utils.externalInjection("bot.json");
        appconfig = JSON.parse(appconfig);
        spinner.start("Downloading chrome\n");
        const browserFetcher = puppeteer.createBrowserFetcher({
            path: process.cwd()
        });
        const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_grey);
        progressBar.start(100, 0);
        var revNumber = await rev.getRevNumber();
        const revisionInfo = await browserFetcher.download(revNumber, (download, total) => {
            //console.log(download);
            var percentage = (download * 100) / total;
            progressBar.update(percentage);
        });
        progressBar.update(100);
        spinner.stop("Downloading chrome ... done!");
        //console.log(revisionInfo.executablePath);
        spinner.start("Launching Chrome");
        var pptrArgv = [];
        if (argv.proxyURI) {
            pptrArgv.push('--proxy-server=' + argv.proxyURI);
        }
        const extraArguments = Object.assign({});
        extraArguments.userDataDir = constants.DEFAULT_DATA_DIR;
        const browser = await puppeteer.launch({
            executablePath: revisionInfo.executablePath,
            defaultViewport: null,
            userDataDir: path.join(process.cwd(), "ChromeSession"),
            headless: appconfig.appconfig.headless,
            devtools: false,
            args: [...constants.DEFAULT_CHROMIUM_ARGS, ...pptrArgv], ...extraArguments
        });
        spinner.stop("Launching Chrome ... done!");
        if (argv.proxyURI) {
            spinner.info("Using a Proxy Server");
        }
        spinner.start("Opening Whatsapp");
        page = await browser.pages();
        if (page.length > 0) {
            page = page[0];
            page.setBypassCSP(true);
            if (argv.proxyURI) {
                await page.authenticate({ username: argv.username, password: argv.password });
            }
            page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");
            await page.goto('https://web.whatsapp.com', {
                waitUntil: 'networkidle0',
                timeout: 0
            });
            //console.log(contents);
            //await injectScripts(page);
            botjson.then((data) => {
                page.evaluate("var intents = " + data);
                //console.log(data);
            }).catch((err) => {
                console.log("there was an error \n" + err);
            });
            spinner.stop("Opening Whatsapp ... done!");
            page.exposeFunction("log", (message) => {
                console.log(message);
            });

            // When the settings file is edited multiple calls are sent to function. This will help
            // to prevent from getting corrupted settings data
            let timeout = 5000;

            // Register a filesystem watcher
            fs.watch(constants.BOT_SETTINGS_FILE, (event, filename) => {
                setTimeout(() => {
                    settings.LoadBotSettings(event, filename, page);
                }, timeout);
            });

            page.exposeFunction("getFile", utils.getFileInBase64);
            page.exposeFunction("resolveSpintax", spintax.unspin);
        }
    }


}

async function injectScripts(page) {
    return await page.waitForSelector('[data-icon=laptop]')
        .then(async () => {
            var filepath = path.join(__dirname, "WAPI.js");
            await page.addScriptTag({ path: require.resolve(filepath) });
            filepath = path.join(__dirname, "inject.js");
            await page.addScriptTag({ path: require.resolve(filepath) });
            global.scriptsInjected = true;
            return true;
        })
        .catch(() => {
            console.log("User is not logged in. Waited 30 seconds.");
            return false;
        })
}

async function checkLogin() {

    var output = await page.evaluate("localStorage['last-wid']");
    //console.log("\n" + output);
    if (output && !global.scriptsInjected) {
        spinner.stop("Looks like you are already logged in");
        await injectScripts(page);
    } else if (!output) {
        global.scriptsInjected = false;
        spinner.info("You are not logged in. Please scan the QR below");
    } else {
        spinner.info("You are logged in.");
    }
    return output;
}


async function getQRcode() {
    try{
        var scanme = "img[alt='Scan me!'], canvas";
        await page.goto('https://web.whatsapp.com', {
            waitUntil: 'networkidle0',
            timeout: 0
        });
        await page.waitForSelector(scanme,{timeout: 3000});
        var imageData = await page.evaluate(`document.querySelector("${scanme}").parentElement.getAttribute("data-ref")`);
        return imageData;
    }catch(err){
        console.log("Not able to find canvas in given time");
        return "";
    }
}

module.exports = {
    initWbot: Main,
    getQRcode,
    checkLogin
}

