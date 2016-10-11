"use strict";
const express = require("express");
const es = require("./../index");
var app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
var router = new es.Router(app);
router.load(__dirname + "/config.json", __dirname);
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
