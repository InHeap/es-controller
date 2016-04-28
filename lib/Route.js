/// <reference path="./../typings/main/ambient/node/index.d.ts" />
/// <reference path="./../typings/main/ambient/express/index.d.ts" />
/// <reference path="./../typings/main/ambient/express-serve-static-core/index.d.ts" />
/// <reference path="./../typings/main/ambient/serve-static/index.d.ts" />
/// <reference path="./../typings/main/ambient/mime/index.d.ts" />
/// <reference path="./../typings/main/ambient/xregexp/index.d.ts" />
"use strict";
const fs = require("fs");
const path = require("path");
const xregexp = require("xregexp");
const Controller_1 = require("./Controller");
const ControllerContainer_1 = require("./ControllerContainer");
const RequestContainer_1 = require("./RequestContainer");
class default_1 {
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
        this.fileList(dir, includeSubDir, (filename) => {
            if (filename.endsWith(".js")) {
                let m = require(filename);
                let keys = Reflect.ownKeys(m);
                keys.forEach((k) => {
                    let c = Reflect.get(m, k);
                    this.bindController(k.toString(), c);
                });
            }
        });
        Promise.resolve(this.setTemplate(this.template));
    }
    bindController(controllerName, controller) {
        if (typeof controller === "function") {
            let t = new controller();
            if (t instanceof Controller_1.default) {
                let c = new ControllerContainer_1.default();
                c.bind(controller);
                this.controllerMap.set(controllerName, c);
            }
        }
    }
    fileList(dir, includeSubDir, callback) {
        fs.readdir(dir, (err, files) => {
            files.forEach((file) => {
                let name = path.join(dir, file);
                fs.stat(name, (err, stats) => {
                    if (stats.isDirectory()) {
                        if (includeSubDir) {
                            this.fileList(name, includeSubDir, callback);
                        }
                    }
                    else if (typeof callback === "function") {
                        callback(name);
                    }
                });
            });
        });
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
        let reqCon = new RequestContainer_1.default();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
