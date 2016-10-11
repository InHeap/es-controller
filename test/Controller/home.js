"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const es = require("./../../index");
class Home extends es.Controller {
    constructor() {
        super(...arguments);
        this.context = null;
    }
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
__decorate([
    es.Decorators.Inject("Context")
], Home.prototype, "context", void 0);
exports.Home = Home;
