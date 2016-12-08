"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require("fs");
const path = require("path");
const xregexp = require("xregexp");
const Controller_1 = require("./Controller");
const ControllerContainer_1 = require("./ControllerContainer");
const RequestContainer_1 = require("./RequestContainer");
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
    bind(dir, includeSubDir) {
        let fileNames = this.fileList(dir, includeSubDir);
        for (let i = 0; i < fileNames.length; i++) {
            let filename = fileNames[i];
            if (filename.endsWith(".js")) {
                let m = require(filename);
                let keys = Reflect.ownKeys(m);
                keys.forEach((k) => {
                    let c = Reflect.get(m, k);
                    if (k === 'default') {
                        k = filename.match(/(?!.*\/|\\)(\w*)/g)[0];
                    }
                    this.bindController(k.toString(), c);
                });
            }
        }
        this.setTemplate(this.template);
    }
    bindController(controllerName, controller) {
        if (typeof controller === "function") {
            let t = new controller();
            if (t instanceof Controller_1.default) {
                let c = new ControllerContainer_1.default();
                c.bind(controller);
                controllerName = controllerName.replace('Controller', '');
                this.controllerMap.set(controllerName.toLowerCase(), c);
            }
        }
    }
    fileList(dir, includeSubDir) {
        let files = fs.readdirSync(dir);
        let fileNames = new Array();
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let name = path.join(dir, file);
            let stats = fs.statSync(name);
            if (stats.isDirectory()) {
                if (includeSubDir) {
                    fileNames = fileNames.concat(this.fileList(name, includeSubDir));
                }
            }
            else {
                fileNames.push(name);
            }
        }
        return fileNames;
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
                    urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w*)");
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
        if (!xregexp.test(req.url, this.reg)) {
            return reqCon;
        }
        reqCon.parts = xregexp.exec(req.url, this.reg);
        if (reqCon.parts["controller"]) {
            reqCon.controllerName = reqCon.parts["controller"];
        }
        else if (this.defaults.get("controller")) {
            reqCon.controllerName = this.defaults.get("controller");
        }
        if (reqCon.controllerName) {
            reqCon.controllerContainer = this.controllerMap.get(reqCon.controllerName.toLowerCase());
        }
        if (!reqCon.controllerContainer) {
            return reqCon;
        }
        if (reqCon.parts["action"]) {
            reqCon.actionName = reqCon.parts["action"];
        }
        else if (this.defaults.get("action")) {
            reqCon.actionName = this.defaults.get("action");
        }
        reqCon.action = reqCon.controllerContainer.getAction(req.method, reqCon.actionName);
        if (!reqCon.action) {
            return reqCon;
        }
        reqCon.match = true;
        return reqCon;
    }
    handle(reqCon) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.templateParams.length; i++) {
                let x = this.templateParams[i];
                if (reqCon.parts[x]) {
                    reqCon.req.params[x] = reqCon.parts[x];
                }
                else {
                    reqCon.req.params[x] = this.defaults.get(x);
                }
            }
            return yield reqCon.controllerContainer.handle(reqCon);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Route;
