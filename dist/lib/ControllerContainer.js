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
        Object.assign(reqCon.req.params, reqCon.req.query);
        reqCon.set('request', reqCon.req);
        reqCon.set('response', reqCon.res);
        let controller = this.generate();
        controller.reqCon = reqCon;
        reqCon.controller = controller;
        await controller.init();
        let result = await Reflect.apply(reqCon.action, controller, [reqCon.req.params, reqCon.req.body]);
        if (result == null || result === undefined) {
        }
        else if (reqCon.req.accepts("json")) {
            reqCon.res.json(result);
        }
        else if (reqCon.req.accepts("html")) {
            let viewName = reqCon.controllerName + "/" + reqCon.actionName;
            reqCon.res.render(viewName, result, null);
        }
        else {
            reqCon.res.send(result);
        }
    }
}
exports.default = ControllerContainer;
