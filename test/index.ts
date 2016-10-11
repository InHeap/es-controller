/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/mustache/index.d.ts" />
/// <reference path="./../index.ts" />

import express = require("express");
import es = require("./../index");

/*app.get('/', function(req, res) {
    res.send('Hello World!');
});*/

var app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// var defaults: Map<string, string> = new Map<string, string>();
// defaults.set("controller", "Home");
// defaults.set("action", null);
// defaults.set("id", null);

var router = new es.Router(app);
router.load(__dirname + "/config.json", __dirname);
// router.add("Default", "/{controller}/{action}", __dirname + "/Controller", defaults, false);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
