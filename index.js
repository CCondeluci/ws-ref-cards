'use strict';

// imports
const request = require('request-promise-native');
const fs = require('fs');
const cheerio = require('cheerio');

const HOTC = 'https://heartofthecards.com/code/cardlist.html?card=WS_';
const HOTC_IMG = 'https://heartofthecards.com/images/cards/ws/';
const SHORT = '&short=1';

// golly gee mister i sure love node
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// async flag for await
(async () => {
    // Get deck information from encoredecks
    var options = {
        url: 'http://184.105.3.85:8080/api/deck/' + process.argv[2],
        json: true
    };
    let returnedDeck = await request(options);

    // Set quantities and code from encoredecks
    let parsedDeck = [];
    for (let card of returnedDeck.cards) {
        let findIndex = parsedDeck.findIndex(obj => obj._id == card._id);
        if (findIndex < 0) {
            card.ws_code = card.set + '/' + card.side + card.release + '-' + card.sid;
            card.ws_qty = 1;
            parsedDeck.push(card);
        } else {
            parsedDeck[findIndex].ws_qty += 1;
        }
    };

    // get translation ref cards
    let refcardHTML = '<html><head></head><style>div { page-break-inside:auto } table { page-break-inside:avoid; page-break-after:auto }</style><body>';
    for (let card of parsedDeck) {
        var options = {
            url: HOTC + card.ws_code + SHORT,
            json: true
        };
        let body = await request(options);
        // parse and index full html response
        let root = cheerio.load(body);
        // set the img link to true hotc
        root('img').attr('src', HOTC_IMG + card.ws_code.replace('/', '-').toLowerCase() + '.gif');
        // rip the card translation 
        let refCard = '<table width="400" style="border:1px solid black">' + root('table').html() + '</table>';
        refcardHTML += refCard;
        console.log("DONE: " + card.ws_code);
    }

    refcardHTML += '</body></html>';

    fs.writeFileSync('refcards.html', refcardHTML);
})();
