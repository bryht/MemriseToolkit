"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const readline = require("readline");
const https = require("https");
const cheerio = require("cheerio");
let worldArray = new Array();
//Clear the word result file and folder
fs.writeFile('wordlist-result.txt', '', () => { });
fs.emptyDir('audio', err => { console.log(err); });
//Get the word list
let wordlistStream = fs.createReadStream('wordlist.txt');
let wordlistReadLine = readline.createInterface(wordlistStream);
wordlistReadLine.on('line', line => {
    let wordResult = searchWord(line);
    wordResult.then(define => {
        console.log(define);
        saveWord(line, define.toString());
    });
});
//Check word from these websites.
//http://www.oxfordlearnersdictionaries.com/search/english/direct/?q=sacrifice
//http://www.ldoceonline.com/search/direct/?q=jersey
//https://translate.google.com/?q=jersey
function searchWord(input) {
    //get the define
    let content = new Promise((resolve, reject) => {
        let options = {
            "method": "GET",
            "hostname": "www.ldoceonline.com",
            "path": "/dictionary/" + input
        };
        let req = https.request(options, function (res) {
            let chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                let body = Buffer.concat(chunks);
                let $body = cheerio.load(body.toString());
                let pos = "[" + $body('.POS').first().text().trim() + "]";
                let pron = "[" + $body('.PRON').first().text().trim() + "]";
                let define = $body('#' + input + '__1 .DEF').text().replace(/,/g, '.');
                let mp3Url = 'https://www.ldoceonline.com/' + $body('.brefile').first().attr('data-src-mp3');
                saveMp3File(mp3Url, input);
                resolve(pos + define + ',' + pron);
            });
        });
        req.end();
    });
    return content;
}
function saveMp3File(url, fileName) {
    var file = fs.createWriteStream('audio/' + fileName + ".mp3");
    file.on('finish', function () {
        file.close(); // close() is async, call cb after close completes.
    });
    var request = https.get(url, res => {
        res.pipe(file);
    });
}
function saveWord(word, define) {
    fs.appendFile('wordlist-result.txt', word + ',' + define + '\n', function (err) {
        if (err) {
            console.log(err.message);
            throw err;
        }
        console.log(word + ' Saved!');
    });
}
