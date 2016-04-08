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
                    if (param !== "controller" || param !== "action") {
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
    handle(req, res) {
        // Check for template regular expression
        if (!xregexp.test(req.url, this.reg)) {
            return false;
        }
        let parts = xregexp.exec(req.url, this.reg);
        // Check Controller
        let con = null;
        if (parts["controller"]) {
            con = this.controllerMap.get(parts["controller"]);
        }
        else if (this.defaults.get("controller")) {
            con = this.controllerMap.get(this.defaults.get("controller"));
        }
        if (!con) {
            return false;
        }
        // Check Action
        let action = null;
        if (parts["action"]) {
            action = con.getAction(req.method, parts["action"]);
        }
        else if (this.defaults.get("action")) {
            action = con.getAction(req.method, this.defaults.get("action"));
        }
        else {
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
            }
            else {
                req.params[x] = this.defaults.get(x);
            }
        }
        con.handle(action, req, res);
        return true;
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
    addRoute(route) {
        this.routes.push(route);
    }
}
exports.Router = Router;
exports.router = new Router();
function handler(req, res, next) {
    for (let i = 0; i < exports.router.routes.length; i++) {
        let route = exports.router.routes[i];
        if (route.handle(req, res)) {
            break;
        }
    }
    next();
}
exports.handler = handler;
