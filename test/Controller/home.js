"use strict";
const es = require("./../../index");
class Home extends es.Controller {
    get_index() {
        return this.view({
            title: "Title",
            message: "Hello"
        });
    }
    index() {
        return "Returning Index request for all methods";
    }
    get() {
        return {
            title: "Title",
            message: "Hello"
        };
    }
    post() {
        return "Post Response has been created";
    }
}
exports.Home = Home;
