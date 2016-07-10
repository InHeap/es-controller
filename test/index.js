"use strict";
const express = require("express");
const es = require("./../index");
var app = express();
var router = es.router;
router.load(__dirname + "/config.json", __dirname);
app.use(es.handler);
app.listen(3000, function () {
});
