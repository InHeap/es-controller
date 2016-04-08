/// <reference path="../typings/main/ambient/node/index.d.ts" />
/// <reference path="../typings/main/ambient/express/index.d.ts" />
/// <reference path="./../index.ts" />

import express = require("express");
import es = require("./../index");

/*app.get('/', function(req, res) {
    res.send('Hello World!');
});*/

var app = express();
var defaults: Map<string, string> = new Map<string, string>();
defaults.set("controller", "Home");
defaults.set("action", "index");

var router = es.router;
router.add("Default", "/{controller}/{action}", __dirname + "/Controller", defaults, false);

app.use(es.handler);

app.listen(3000, function() {
    // console.log('Example app listening on port 3000!');
});
