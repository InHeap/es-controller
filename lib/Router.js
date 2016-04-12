/// <reference path="./../typings/main/ambient/node/index.d.ts" />
"use strict";
const fs = require("fs");
const Route_1 = require("./Route");
class default_1 {
    constructor() {
        this.routes = new Array();
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
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
