"use strict";
class Controller {
    constructor() {
        this.reqCon = null;
        this.filters = new Array();
    }
    $init() {
    }
    $get(key) {
        if (this.reqCon) {
            return this.reqCon.get(key);
        }
        else {
            return null;
        }
    }
    $view(args, viewName) {
        return new View(viewName, args);
    }
    $response(response, status) {
        return new Response(status, response);
    }
    $accept(response, status) {
        if (!status)
            status = 200;
        return new Response(status, response);
    }
    $reject(response, status) {
        if (!status)
            status = 400;
        return new Response(status, response);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Controller;
class View {
    constructor(viewName, args) {
        this.viewName = "";
        this.args = null;
        this.viewName = viewName;
        this.args = args;
    }
}
exports.View = View;
class Response {
    constructor(status, body) {
        this.status = 200;
        this.body = null;
        this.status = status;
        this.body = body;
    }
}
exports.Response = Response;
