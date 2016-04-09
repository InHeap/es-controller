// import * as fs from "fs";
// import * as path from "path";
// import * as express from "express";
// import * as xregexp from "xregexp";
// import {System} from "es6-module-loader";
"use strict";
/// <reference path="typings/main/ambient/node/index.d.ts" />
/// <reference path="typings/main/ambient/express/index.d.ts" />
/// <reference path="typings/main/ambient/xregexp/index.d.ts" />
/// <reference path="typings/main/ambient/express-serve-static-core/index.d.ts" />
/// <reference path="typings/main/ambient/serve-static/index.d.ts" />
/// <reference path="typings/main/ambient/mime/index.d.ts" />
const fs = require("fs");
const path = require("path");
const xregexp = require("xregexp");
const Reflect = require("harmony-reflect");
class Controller {
    constructor() {
    }
    init(req, res) {
        this.req = req;
        this.res = res;
    }
}
exports.Controller = Controller;
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
exports.ControllerContainer = ControllerContainer;
class RequestContainer {
    constructor() {
        this.match = false;
        this.parts = null;
        this.controller = null;
        this.action = null;
    }
}
class Route {
    constructor(name, template, dir, defaults, includeSubDir) {
        this.templateParams = new Array();
        this.templateregex = xregexp("{(?<identifier>\\w+)}", "g");
        this.controllerMap = new Map();
        this.name = name;
        this.template = template;
        this.dir = dir;
        this.defaults = defaults;
        this.includeSubDir = includeSubDir;
        this.bind(this.dir, this.includeSubDir);
    }
    // Binding Controller
    bind(dir, includeSubDir) {
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
    bindController(controllerName, controller) {
        if (typeof controller === "function") {
            let t = new controller();
            if (t instanceof Controller) {
                let c = new ControllerContainer();
                c.bind(controller);
                this.controllerMap.set(controllerName, c);
            }
        }
    }
    fileList(dir, includeSubDir) {
        let list = new Array();
        let entries = fs.readdirSync(dir);
        for (let i = 0; i < entries.length; i++) {
            let file = entries[i];
            let name = path.join(dir, file);
            if (fs.statSync(name).isDirectory()) {
                if (includeSubDir) {
                    list.concat(this.fileList(name, includeSubDir));
                }
            }
            else {
                list.push(name);
            }
        }
        return list;
    }
    setTemplate(template) {
        this.template = template;
        let urlregexStr = "";
        let words = this.template.split("/");
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            if (word) {
                if (xregexp.test(word, this.templateregex)) {
                    let param = xregexp.exec(word, this.templateregex)["identifier"];
                    if (param && param !== "controller" && param !== "action") {
                        this.templateParams.push(param);
                    }
                    if (this.defaults.has(param)) {
                        urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w*)");
                    }
                    else {
                        urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w+)");
                    }
                }
                else {
                    urlregexStr += "/" + word;
                }
            }
        }
        this.reg = xregexp(urlregexStr, "g");
    }
    match(req) {
        let reqCon = new RequestContainer();
        // Check for template regular expression
        if (!xregexp.test(req.url, this.reg)) {
            return reqCon;
        }
        reqCon.parts = xregexp.exec(req.url, this.reg);
        // Check Controller
        if (reqCon.parts["controller"]) {
            reqCon.controller = this.controllerMap.get(reqCon.parts["controller"]);
        }
        else if (this.defaults.get("controller")) {
            reqCon.controller = this.controllerMap.get(this.defaults.get("controller"));
        }
        if (!reqCon.controller) {
            return reqCon;
        }
        // Check Action
        if (reqCon.parts["action"]) {
            reqCon.action = reqCon.controller.getAction(req.method, reqCon.parts["action"]);
        }
        else if (this.defaults.get("action")) {
            reqCon.action = reqCon.controller.getAction(req.method, this.defaults.get("action"));
        }
        else {
            reqCon.action = reqCon.controller.getAction(req.method, null);
        }
        if (!reqCon.action) {
            return reqCon;
        }
        reqCon.match = true;
        return reqCon;
    }
    handle(req, res, reqCon) {
        let p = new Promise((resolve) => {
            // Setting Request Parameters
            for (let i = 0; i < this.templateParams.length; i++) {
                let x = this.templateParams[i];
                if (reqCon.parts[x]) {
                    req.params[x] = reqCon.parts[x];
                }
                else {
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
exports.Route = Route;
class Router {
    constructor() {
        this.routes = new Array();
    }
    add(name, template, dir, defaults, includeSubDir) {
        let route = new Route(name, template, dir, defaults, includeSubDir);
        this.addRoute(route);
    }
    mapToObj(strMap) {
        let obj = new Object();
        strMap.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }
    objToMap(obj) {
        let strMap = new Map();
        for (let k of Object.keys(obj)) {
            strMap.set(k, obj[k]);
        }
        return strMap;
    }
    addRoute(obj) {
        let m = null;
        if (obj.defaults instanceof Map) {
            m = obj.defaults;
        }
        else {
            m = this.objToMap(obj.defaults);
        }
        let route = new Route(obj.name, obj.template, obj.dir, m, obj.includeSubDir);
        this.routes.push(route);
    }
    load(fileName) {
        fs.readFile(fileName, "utf-8", (err, data) => {
            let obj = JSON.parse(data);
            if (Array.isArray(obj)) {
                obj.forEach(element => {
                    this.addRoute(element);
                });
            }
            else {
                this.addRoute(obj);
            }
        });
    }
}
exports.Router = Router;
exports.router = new Router();
function handler(req, res, next) {
    for (let i = 0; i < exports.router.routes.length; i++) {
        let route = exports.router.routes[i];
        let reqCon = route.match(req);
        if (reqCon.match) {
            let p = route.handle(req, res, reqCon);
            p.then(next);
            break;
        }
    }
}
exports.handler = handler;
