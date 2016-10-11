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
const Route_1 = require("./Route");
class default_1 {
    constructor(app) {
        this.routes = new Array();
        this.app = null;
        this.setApp(app);
    }
    setApp(app) {
        if (app) {
            this.app = app;
            app.set("Router", this);
            app.use(this.handler);
        }
    }
    add(name, template, dir, defaults, includeSubDir) {
        let route = new Route_1.default(name, template, dir, defaults, includeSubDir);
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
    addRoute(obj, baseDir) {
        let m = null;
        if (obj.defaults instanceof Map) {
            m = obj.defaults;
        }
        else {
            m = this.objToMap(obj.defaults);
        }
        if (baseDir) {
            obj.dir = obj.dir.replace("{dirname}", baseDir);
        }
        let route = new Route_1.default(obj.name, obj.template, obj.dir, m, obj.includeSubDir);
        this.routes.push(route);
    }
    load(fileName, baseDir) {
        fs.readFile(fileName, "utf-8", (err, data) => {
            let obj = JSON.parse(data);
            if (Array.isArray(obj)) {
                obj.forEach(element => {
                    this.addRoute(element, baseDir);
                });
            }
            else {
                this.addRoute(obj, baseDir);
            }
        });
    }
    handler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let app = req.app;
            let that = app.get("Router");
            for (let i = 0; i < that.routes.length; i++) {
                let route = that.routes[i];
                let reqCon = route.match(req);
                if (reqCon.match) {
                    yield route.handle(req, res, reqCon);
                    break;
                }
            }
            next();
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
