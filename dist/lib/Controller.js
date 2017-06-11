"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Controller {
    constructor() {
        this.reqCon = null;
        this.ctx = null;
        this.request = null;
        this.body = null;
    }
    async init() {
    }
    view(args, viewName) {
        if (!viewName) {
            viewName = this.reqCon.controllerName + "/" + this.reqCon.actionName;
        }
        this.ctx.render(viewName, args);
    }
}
exports.default = Controller;
