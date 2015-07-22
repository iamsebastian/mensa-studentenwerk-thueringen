'use strict';
let mensa = process.argv[2] || 'nordhausen',
    dom = require('jsdom'),
    domCallback,
    Iconv = require('iconv').Iconv,
    req = require('request'),
    url,
    util = require('util');

mensa = mensa.toLowerCase().trim();

url = `http://www.stw-thueringen.de/deutsch/mensen/einrichtungen/${mensa}/mensa-${mensa}.html`;

domCallback = function domCallback(errors, window) {
    let $ = window.jQuery;

    console.log($('#day_4 tr:nth-of-type(2) td:nth-of-type(2)').html().trim().match(/[\w\ ,\+äöüß]+/i)[0].trim());
    console.log($('#day_4 tr:nth-of-type(3) td:nth-of-type(2)').html().trim().match(/[\w\ ,\+äöüß]+/i)[0].trim());
    console.log($('#day_4 tr:nth-of-type(4) td:nth-of-type(2)').html().trim().match(/[\w\ ,\+äöüß]+/i)[0].trim());
};

req(url,
    {encoding: null},
    function gotRequestCb(error, resp, body) {
        let iconv,
        html;

        iconv = new Iconv('ISO-8859-1', 'UTF-8//TRANSLIT//IGNORE');

        html = iconv.convert(body);

        dom.env({
            html: html,
            scripts: ['http://code.jquery.com/jquery-1.5.min.js'],
            done: domCallback
        });

    }
   );


