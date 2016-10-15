"use strict";
const DependencyContainer_1 = require("./DependencyContainer");
class default_1 {
    constructor() {
        this.router = null;
        this.dependencies = new DependencyContainer_1.default();
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
        if (typeof key === 'string') {
            key = key.toLowerCase();
        }
        let res = this.dependencies.get(key);
        if (!res) {
            res = this.router.get(key);
        }
        return res;
    }
    set(key, value) {
        this.dependencies.set(key.toLowerCase(), value);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
