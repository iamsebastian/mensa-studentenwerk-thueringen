'use strict';
let Iconv = require('iconv').Iconv,
    fs = require('fs'),
    app,
    destinationHtmlPath = process.argv[2] || null,
    dom = require('jsdom'),
    domCallback,
    express = require('express'),
    extractFood,
    foods,
    hbs,
    Hbs = require('express-handlebars'),
    hbsHelpers = require('./lib/helpers'),
    mensa = 'nordhausen',
    renderOptions,
    req = require('request'),
    url;

mensa = mensa.toLowerCase().trim();

url = `http://www.stw-thueringen.de/deutsch/mensen/einrichtungen/${mensa}/mensa-${mensa}.html`;

hbs = Hbs.create({
    defaultLayout: 'main',
    helpers: hbsHelpers
});

extractFood = function extractFood(window, number) {
    let $ = window.jQuery,
        day = new Date().getDay() + 1,
        index = number + 1,
        _food,
        _price;


    _food = $(`#day_${day} tr:nth-of-type(${index}) td:nth-of-type(2)`).html().trim()
        .match(/[\w\ ,\+äöüß\-]+/i)[0].trim();

    _price = $(`#day_${day} > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(${index}) > td:nth-child(3)`)
        .html().match(/\d\,\d{1,2}\ €/)[0];

    return {
        name: _food,
        price: _price
    };
};

domCallback = function domCallback(errors, window) {
    let foodCount = 3;

    foods = foods || [];

    while(foodCount) {
        foods.push(extractFood(window, foodCount--));
    }

    renderOptions = {
        foods: foods
    };

    app.render('home', renderOptions, function renderCb(err, str) {
        console.log(str);

        if (destinationHtmlPath) {
            fs.writeFile(destinationHtmlPath, str);
        }
    });
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

app = express();

app.engine('handlebars', hbs.engine);

app.set('view engine', 'handlebars');
