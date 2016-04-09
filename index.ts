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
        let p = new Promise((resolve) => {
            this.generate = function(): Controller {
                return new controller();
            };
            let c = this.generate();
            resolve(c);
        });

        p.then((c: Controller) => {
            let keys: string[] = Reflect.ownKeys(controller.prototype);
            keys.forEach((k) => {
                if (k && k !== "constructor") {
                    let o = Reflect.get(c, k);
                    if (typeof o === "function") {
                        this.actionMap.set(k, o);
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

class RequestContainer {
    match: boolean = false;
    parts: RegExpExecArray = null;
    controller: ControllerContainer = null;
    action: any = null;
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
        this.fileList(dir, includeSubDir, (filename: string) => {
            if (filename.endsWith(".js")) {
                let m = require(filename);
                let keys: string[] = Reflect.ownKeys(m);
                keys.forEach((k: string) => {
                    let c = Reflect.get(m, k);
                    this.bindController(k, c);
                });
            }
        });
        Promise.resolve(this.setTemplate(this.template));
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

    private fileList(dir: string, includeSubDir: boolean, callback: any): void {
        fs.readdir(dir, (err, files: string[]) => {
            files.forEach((file: string) => {
                let name = path.join(dir, file);
                fs.stat(name, (err, stats: fs.Stats) => {
                    if (stats.isDirectory()) {
                        if (includeSubDir) {
                            this.fileList(name, includeSubDir, callback);
                        }
                    } else if (typeof callback === "function") {
                        callback(name);
                    }
                });
            });
        });
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
                    if (param && param !== "controller" && param !== "action") {
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

    match(req: express.Request): RequestContainer {
        let reqCon: RequestContainer = new RequestContainer();

        // Check for template regular expression
        if (!xregexp.test(req.url, this.reg)) {
            return reqCon;
        }
        reqCon.parts = xregexp.exec(req.url, this.reg);

        // Check Controller
        if (reqCon.parts["controller"]) {
            reqCon.controller = this.controllerMap.get(reqCon.parts["controller"]);
        } else if (this.defaults.get("controller")) {
            reqCon.controller = this.controllerMap.get(this.defaults.get("controller"));
        }
        if (!reqCon.controller) {
            return reqCon;
        }

        // Check Action
        if (reqCon.parts["action"]) {
            reqCon.action = reqCon.controller.getAction(req.method, reqCon.parts["action"]);
        } else if (this.defaults.get("action")) {
            reqCon.action = reqCon.controller.getAction(req.method, this.defaults.get("action"));
        } else {
            reqCon.action = reqCon.controller.getAction(req.method, null);
        }
        if (!reqCon.action) {
            return reqCon;
        }

        reqCon.match = true;
        return reqCon;
    }

    handle(req: express.Request, res: express.Response, reqCon: RequestContainer): Promise<any> {
        let p: Promise<any> = new Promise((resolve) => {
            // Setting Request Parameters
            for (let i = 0; i < this.templateParams.length; i++) {
                let x = this.templateParams[i];
                if (reqCon.parts[x]) {
                    req.params[x] = reqCon.parts[x];
                } else {
                    req.params[x] = this.defaults.get(x);
                }
            }
            resolve();
        });

        p.then(() => {
            reqCon.controller.handle(reqCon.action, req, res);
        });

        return p;
    }

}

export class Router {
    routes: Route[] = new Array<Route>();

    constructor() { }

    public add(name: string, template: string, dir: string, defaults: Map<string, string>, includeSubDir: boolean): void {
        let route = new Route(name, template, dir, defaults, includeSubDir);
        this.addRoute(route);
    }

    public mapToObj(strMap: Map<string, any>): any {
        let obj = new Object();
        strMap.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }

    objToMap(obj: any): Map<string, any> {
        let strMap: Map<string, any> = new Map<string, any>();
        for (let k of Object.keys(obj)) {
            strMap.set(k, obj[k]);
        }
        return strMap;
    }

    public addRoute(obj: any): void {
        let m: Map<string, any> = null;
        if (obj.defaults instanceof Map) {
            m = obj.defaults;
        } else {
            m = this.objToMap(obj.defaults);
        }
        obj.dir = obj.dir.replace("{dirname}", __dirname);
        let route: Route = new Route(obj.name, obj.template, obj.dir, m, obj.includeSubDir);
        this.routes.push(route);
    }

    public load(fileName: string): void {
        fs.readFile(fileName, "utf-8", (err: NodeJS.ErrnoException, data: string) => {
            let obj = JSON.parse(data);
            if (Array.isArray(obj)) {
                obj.forEach(element => {
                    this.addRoute(element);
                });
            } else {
                this.addRoute(obj);
            }
        });
    }

}

export var router: Router = new Router();

export function handler(req: express.Request, res: express.Response, next: express.NextFunction): any {
    for (let i = 0; i < router.routes.length; i++) {
        let route: Route = router.routes[i];
        let reqCon: RequestContainer = route.match(req);
        if (reqCon.match) {
            let p = route.handle(req, res, reqCon);
            p.then(next);
            break;
        }
    }
}