"use strict";
const es = require("./../../index");
class Home extends es.Controller {
    get_index() {
        this.res.send("Returning Get Index request");
    }
    index() {
        this.res.send("Returning Index request for all methods");
    }
    get() {
        this.res.send("Get Response has been created");
    }
    post() {
        this.res.send("Post Response has been created");
    }
}
exports.Home = Home;
