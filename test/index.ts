/// <reference path="./../index.ts" />

import * as express from "express";
import * as es from "./../index";

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
// router.filters.push((req, res, next) => {
// 	res.setHeader("testing", "Success");
// 	next();
// });

router.load(__dirname + "/config.json", __dirname);
// router.add("Default", "/{controller}/{action}", __dirname + "/Controller", defaults, false);

app.use([function (err, req, res, next) {
	console.error(err);
	res.status(500).send('Something broke!');
}]);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
