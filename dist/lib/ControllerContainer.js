"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ControllerContainer {
    constructor() {
        this.actionMap = new Map();
    }
    bind(controller) {
        this.generate = function () {
            return new controller();
        };
        let c = this.generate();
        let keys = Reflect.ownKeys(controller.prototype);
        keys.forEach((k) => {
            if (k && k.startsWith('$')) {
                let o = Reflect.get(c, k);
                if (typeof o === "function") {
                    this.actionMap.set(k.toString().substring(1).toLowerCase(), o);
                }
            }
        });
    }
    getAction(method, actionName) {
        method = method.toLowerCase();
        let action = null;
        if (actionName) {
            actionName = actionName.toLowerCase();
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
    async handle(reqCon) {
        Object.assign(reqCon.ctx.params, reqCon.ctx.query);
        let controller = this.generate();
        controller.reqCon = reqCon;
        controller.ctx = reqCon.ctx;
        await controller.init();
        let result = await Reflect.apply(reqCon.action, controller, [reqCon.ctx]);
        if (result == null || result === undefined) {
        }
        else if (reqCon.ctx.accepts("json")) {
            reqCon.ctx.body = result;
        }
        else if (reqCon.ctx.accepts("html")) {
            let viewName = reqCon.controllerName + "/" + reqCon.actionName;
            reqCon.ctx.render(viewName, result);
        }
        else {
            reqCon.ctx.body = result;
        }
    }
}
exports.default = ControllerContainer;
