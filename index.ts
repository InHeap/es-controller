// import * as fs from "fs";
// import * as path from "path";
// import * as express from "express";
// import * as xregexp from "xregexp";
// import {System} from "es6-module-loader";

/// <reference path="typings/main/ambient/node/index.d.ts" />
/// <reference path="typings/main/ambient/express/index.d.ts" />
/// <reference path="typings/main/ambient/xregexp/index.d.ts" />
/// <reference path="typings/main/ambient/express-serve-static-core/index.d.ts" />
/// <reference path="typings/main/ambient/serve-static/index.d.ts" />
/// <reference path="typings/main/ambient/mime/index.d.ts" />

import fs = require("fs");
import path = require("path");
import express = require("express");
import xregexp = require("xregexp");
import Reflect = require("harmony-reflect");

interface IClass<T> {
    new (): T;
}

export class Controller {
    req: express.Request;
    res: express.Response;

    init(req: express.Request, res: express.Response): void {
        this.req = req;
        this.res = res;
    }

    constructor() { }

}

interface IControllerFactory {
    (): Controller;
}

export class ControllerContainer {

    name: string;

    actionMap: Map<string, any> = new Map<string, any>();
    generate: IControllerFactory;

    bind(controller: IClass<Controller>): void {
        this.generate = function(): Controller {
            return new controller();
        };
        let c = this.generate();
        let keys: string = Reflect.ownKeys(controller.prototype);
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i];
            if (k && k !== "constructor") {
                let o = Reflect.get(c, k);
                if (typeof o === "function") {
                    this.actionMap.set(k, o);
                }
            }
        }
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

export class Route {
    name: string;
    template: string;
    dir: string;
    defaults: Map<string, string>;
    includeSubDir: boolean;

    private regex: string;
    private templateParams: Array<string> = new Array<string>();
    private templateregex: RegExp = xregexp("{(?<identifier>\\w+)}", "g");
    private reg: RegExp;
    private controllerMap: Map<string, ControllerContainer> = new Map<string, ControllerContainer>();

    constructor(name: string, template: string, dir: string, defaults: Map<string, string>, includeSubDir: boolean) {
        this.name = name;
        this.template = template;
        this.dir = dir;
        this.defaults = defaults;
        this.includeSubDir = includeSubDir;
        this.bind(this.dir, this.includeSubDir);
    }

    // Binding Controller
    bind(dir: string, includeSubDir: boolean): void {
        let files = this.fileList(dir, includeSubDir);
        for (let i = 0; i < files.length; i++) {
            let f = files[i];
            if (f.endsWith(".js")) {
                let m = require(f);
                let keys = Reflect.ownKeys(m);
                for (let j = 0; j < keys.length; j++) {
                    let k = keys[j];
                    let c = Reflect.get(m, k);
                    this.bindController(k.toString(), c);
                }
            }
        }
        this.setTemplate(this.template);
    }

    private bindController(controllerName: string, controller: IClass<Controller>): void {
        if (typeof controller === "function") {
            let t = new controller();
            if (t instanceof Controller) {
                let c = new ControllerContainer();
                c.bind(controller);
                this.controllerMap.set(controllerName, c);
            }
        }
    }

    private fileList(dir: string, includeSubDir: boolean): string[] {
        let list: string[] = new Array<string>();
        let entries = fs.readdirSync(dir);
        for (let i = 0; i < entries.length; i++) {
            let file = entries[i];
            let name = path.join(dir, file);
            if (fs.statSync(name).isDirectory()) {
                if (includeSubDir) {
                    list.concat(this.fileList(name, includeSubDir));
                }
            } else {
                list.push(name);
            }
        }
        return list;
    }

    setTemplate(template: string): void {
        this.template = template;
        let urlregexStr: string = "";
        let words = this.template.split("/");
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            if (word) {
                if (xregexp.test(word, this.templateregex)) {
                    let param: string = xregexp.exec(word, this.templateregex)["identifier"];
                    if (param !== "controller" || param !== "action") {
                        this.templateParams.push(param);
                    }
                    if (this.defaults.has(param)) {
                        urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w*)");
                    } else {
                        urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w+)");
                    }
                } else {
                    urlregexStr += "/" + word;
                }
            }
        }
        this.reg = xregexp(urlregexStr, "g");
    }

    handle(req: express.Request, res: express.Response): boolean {
        // Check for template regular expression
        if (!xregexp.test(req.url, this.reg)) {
            return false;
        }
        let parts = xregexp.exec(req.url, this.reg);

        // Check Controller
        let con: ControllerContainer = null;
        if (parts["controller"]) {
            con = this.controllerMap.get(parts["controller"]);
        } else if (this.defaults.get("controller")) {
            con = this.controllerMap.get(this.defaults.get("controller"));
        }
        if (!con) {
            return false;
        }

        // Check Action
        let action: any = null;
        if (parts["action"]) {
            action = con.getAction(req.method, parts["action"]);
        } else if (this.defaults.get("action")) {
            action = con.getAction(req.method, this.defaults.get("action"));
        } else {
            action = con.getAction(req.method, null);
        }
        if (!action) {
            return false;
        }

        // Setting Request Parameters
        for (let i = 0; i < this.templateParams.length; i++) {
            let x = this.templateParams[i];
            if (parts[x]) {
                req.params[x] = parts[x];
            } else {
                req.params[x] = this.defaults.get(x);
            }
        }
        con.handle(action, req, res);
        return true;
    }

}

export class Router {
    routes: Route[] = new Array<Route>();

    constructor() { }

    public add(name: string, template: string, dir: string, defaults: Map<string, string>, includeSubDir: boolean) {
        let route = new Route(name, template, dir, defaults, includeSubDir);
        this.addRoute(route);
    }

    public addRoute(route: Route): void {
        this.routes.push(route);
    }

}

export var router: Router = new Router();

export function handler(req: express.Request, res: express.Response, next: express.NextFunction): any {
    for (let i = 0; i < router.routes.length; i++) {
        let route = router.routes[i];
        if (route.handle(req, res)) {
            break;
        }
    }
    next();
}