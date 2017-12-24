"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Controller {
    constructor() {
        this.ctx = null;
        this.request = null;
        this.body = null;
        this.controllerName = null;
        this.actionName = null;
        this.filters = new Array();
    }
    init() {
    }
    view(args, viewName) {
        if (!viewName) {
            viewName = this.controllerName + "/" + this.actionName;
        }
        this.ctx.render(viewName, args);
    }
}
exports.default = Controller;
