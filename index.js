'use strict';
process.env.DEBUG = '*';

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
    hbsHelpers = require(`${__dirname}/lib/helpers`),
    mensa = 'nordhausen',
    renderOptions,
    req = require('request'),
    url;

console.log(`Executing parser in ${__dirname}.`);

mensa = mensa.toLowerCase().trim();

url = `http://www.stw-thueringen.de/deutsch/mensen/einrichtungen/${mensa}/mensa-${mensa}.html`;

hbs = Hbs.create({
    defaultLayout: `${__dirname}/views/layouts/main`,
    helpers: hbsHelpers
});

app = express();

app.engine('handlebars', hbs.engine);

app.set('views', `${__dirname}/views`);

app.set('view engine', 'handlebars');

extractFood = function extractFood(window, index, day) {
    let $ = window.jQuery,
        _food,
        _price;


    _food = $(`#day_${day} tr:nth-of-type(${index}) td:nth-of-type(2)`).html().trim()
        .match(/[\w\ ,\+äöüß\-\"]+/i)[0].trim();

    _price = $(`#day_${day} > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(${index}) > td:nth-child(3)`)
        .html().match(/\d\,\d{1,2}\ €/)[0];

    return {
        name: _food,
        price: _price
    };
};

domCallback = function domCallback(errors, window) {
    let foodCount = 3,
        // Today is saturday or sunday? Take monday.
        today = new Date().getDay() > 5 ? 2 : new Date().getDay() + 1,
        todayFoods,
        // Today is friday? Next day is monday.
        tomorrow = today > 5 ? 2 : today + 1,
        tomorrowFoods;

    todayFoods = todayFoods || [];
    tomorrowFoods = tomorrowFoods || [];

    for (var i = 2; i < foodCount + 2; i++) {
        // Correct table index begins with 2, up to 4.
        todayFoods.push(extractFood(window, i, today));
        tomorrowFoods.push(extractFood(window, i, tomorrow));
    }

    renderOptions = {
        foods: {
            today: todayFoods,
            tomorrow: tomorrowFoods
        }
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
