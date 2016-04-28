/// <reference path="./../typings/main/ambient/node/index.d.ts" />
/// <reference path="./../typings/main/ambient/express/index.d.ts" />

import express = require("express");

import Controller from "./Controller";

export interface IClass<T> {
    new (): T;
}

interface IControllerFactory {
    (): Controller;
}

export default class {

    name: string;

    actionMap: Map<string, any> = new Map<string, any>();
    generate: IControllerFactory;

    bind(controller: IClass<Controller>): void {
        let p = new Promise((resolve) => {
            this.generate = function (): Controller {
                return new controller();
            };
            let c = this.generate();
            resolve(c);
        });

        p.then((c: Controller) => {
            let keys: (string | number | symbol)[] = Reflect.ownKeys(controller.prototype);
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

    getAction(method: string, actionName: string): any {
        method = method.toLowerCase();
        let action: any = null;
        if (actionName) {
            action = this.actionMap.get(method + "_" + actionName);
            if (!action) {
                action = this.actionMap.get(actionName);
            }
        } else {
            action = this.actionMap.get(method);
        }
        return action;
    }

    handle(action: any, req: express.Request, res: express.Response): void {
        let c = this.generate();
        c.init(req, res);
        Reflect.apply(action, c, [req, res]);
    }

}