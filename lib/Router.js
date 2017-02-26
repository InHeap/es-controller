"use strict";
const fs = require("fs");
const Route_1 = require("./Route");
const DependencyContainer_1 = require("./DependencyContainer");
class Router {
    constructor(app) {
        this.routes = new Array();
        this.dependencies = new DependencyContainer_1.default();
        if (app) {
            this.setApp(app);
        }
    }
    set(key, value) {
        this.dependencies.set(key, value);
    }
    get(key) {
        return this.dependencies.get(key);
    }
    setApp(app) {
        app.set("Router", this);
        app.use(this.handler);
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
        if (obj) {
            for (let k of Object.keys(obj)) {
                strMap.set(k, obj[k]);
            }
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
    async handler(req, res, next) {
        let app = req.app;
        let that = app.get("Router");
        try {
            for (let i = 0; i < that.routes.length; i++) {
                let route = that.routes[i];
                let reqCon = route.match(req);
                if (reqCon.match) {
                    reqCon.router = that;
                    reqCon.req = req;
                    reqCon.res = res;
                    await route.handle(reqCon);
                    break;
                }
            }
            next();
        }
        catch (err) {
            next(err);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Router;
