"use strict";
class Controller {
    constructor() {
        this.reqCon = null;
    }
    init() {
    }
    get(key) {
        if (this.reqCon) {
            return this.reqCon.get(key);
        }
        else {
            return null;
        }
    }
    view(args, viewName) {
        if (!viewName) {
            viewName = this.reqCon.controllerName + "/" + this.reqCon.actionName;
        }
        this.reqCon.res.render(viewName, args, null);
    }
    response(response, status) {
        status = status ? status : 200;
        this.reqCon.res.status(status);
        this.reqCon.res.send(response);
    }
    redirect(url, status) {
        status = status ? status : 302;
        this.reqCon.res.redirect(status, url);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Controller;
