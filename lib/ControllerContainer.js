/// <reference path="./../typings/main/ambient/node/index.d.ts" />
/// <reference path="./../typings/main/ambient/express/index.d.ts" />
"use strict";
class default_1 {
    constructor() {
        this.actionMap = new Map();
    }
    bind(controller) {
        let p = new Promise((resolve) => {
            this.generate = function () {
                return new controller();
            };
            let c = this.generate();
            resolve(c);
        });
        p.then((c) => {
            let keys = Reflect.ownKeys(controller.prototype);
            keys.forEach((k) => {
                if (k && k !== "constructor") {
                    let o = Reflect.get(c, k);
                    if (typeof o === "function") {
                        this.actionMap.set(k.toString(), o);
                    }
                }
            });
        });
    }
    getAction(method, actionName) {
        method = method.toLowerCase();
        let action = null;
        if (actionName) {
            action = this.actionMap.get(method + "_" + actionName);
            if (!action) {
                action = this.actionMap.get(actionName);
            }
        }
        else {
            action = this.actionMap.get(method);
        }
        return action;
    }
    handle(action, req, res) {
        let c = this.generate();
        c.init(req, res);
        Reflect.apply(action, c, [req, res]);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
