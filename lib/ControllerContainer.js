"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Controller_1 = require("./Controller");
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
            if (k && k !== "constructor" && !k.startsWith('$')) {
                let o = Reflect.get(c, k);
                if (typeof o === "function") {
                    this.actionMap.set(k.toString().toLowerCase(), o);
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
    executeNext(reqCon, next, index) {
        return __awaiter(this, void 0, void 0, function* () {
            let fnc = null;
            let nxt = null;
            if (!index) {
                index = 0;
            }
            if (reqCon.controller.filters.length && reqCon.controller.filters.length > index) {
                fnc = reqCon.controller.filters[index];
                nxt = (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err)
                        throw err;
                    yield this.executeNext(reqCon, next, index + 1);
                });
            }
            else {
                fnc = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                    yield next();
                });
                nxt = next;
            }
            return yield fnc(reqCon.req, reqCon.res, nxt);
        });
    }
    handle(reqCon) {
        return __awaiter(this, void 0, void 0, function* () {
            Object.assign(reqCon.req.params, reqCon.req.query);
            reqCon.set('request', reqCon.req);
            reqCon.set('response', reqCon.res);
            let controller = this.generate();
            controller.reqCon = reqCon;
            reqCon.controller = controller;
            controller.$init();
            let func = (err) => __awaiter(this, void 0, void 0, function* () {
                if (err)
                    throw err;
                let result = yield Reflect.apply(reqCon.action, controller, [reqCon.req.params, reqCon.req.body]);
                if (result == null || result === undefined) {
                    reqCon.res.send();
                }
                else if (result instanceof Controller_1.View) {
                    if (!result.viewName) {
                        result.viewName = reqCon.controllerName + "/" + reqCon.actionName;
                    }
                    reqCon.res.render(result.viewName, result.args, null);
                }
                else if (result instanceof Controller_1.Response) {
                    reqCon.res.status(result.status);
                    reqCon.res.send(result.body);
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
            });
            yield this.executeNext(reqCon, func);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ControllerContainer;
