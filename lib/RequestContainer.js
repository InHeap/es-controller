"use strict";
class default_1 {
    constructor() {
        this.dependencies = null;
        this.req = null;
        this.res = null;
        this.match = false;
        this.parts = null;
        this.controllerName = "";
        this.controller = null;
        this.actionName = "";
        this.action = null;
    }
    get(key) {
        return this.dependencies.get(key.toLowerCase());
    }
    set(key, value) {
        this.dependencies.set(key.toLowerCase(), value);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
