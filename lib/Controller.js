"use strict";
class default_1 {
    constructor() {
        this.reqCon = null;
        this.filters = new Array();
    }
    init(reqCon) {
        this.reqCon = reqCon;
    }
    view(args, viewName) {
        return new View(viewName, args);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
class View {
    constructor(viewName, args) {
        this.viewName = "";
        this.args = null;
        this.viewName = viewName;
        this.args = args;
    }
}
exports.View = View;