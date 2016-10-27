"use strict";
const express = require("express");
const es = require("./../index");
var app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
var router = new es.Router(app);
router.filters.push((req, res, next) => {
    res.setHeader("testing", "Success");
    next();
});
router.load(__dirname + "/config.json", __dirname);
app.use([function (err, req, res, next) {
        console.error(err);
        res.status(500).send('Something broke!');
    }]);
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
