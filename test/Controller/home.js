"use strict";
const es = require("./../../index");
class Home extends es.Controller {
    index() {
        this.res.send("Hello, this is test");
    }
    create() {
        this.res.send("Response has been created");
    }
}
exports.Home = Home;
