'use strict';
let Iconv = require('iconv').Iconv,
    fs = require('fs'),
    app,
    css = fs.readFileSync('./public/css/materialize.min.css'),
    dom = require('jsdom'),
    domCallback,
    express = require('express'),
    extractFood,
    foods,
    hbs,
    Hbs = require('express-handlebars'),
    hbsHelpers = require('./lib/helpers'),
    mensa = process.argv[2] || 'nordhausen',
    req = require('request'),
    url,
    util = require('util');

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

app.get('/', function(req, res) {
    res.render('home', {
        css: css,
        foods: foods
    });
});

app.use(express.static('public/'));

app.listen(1025);
