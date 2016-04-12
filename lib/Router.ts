/// <reference path="./../typings/main/ambient/node/index.d.ts" />

import fs = require("fs");
import Route from "./Route";

export default class {
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

    public addRoute(obj: any, baseDir?: string): void {
        let m: Map<string, any> = null;
        if (obj.defaults instanceof Map) {
            m = obj.defaults;
        } else {
            m = this.objToMap(obj.defaults);
        }
        if (baseDir) {
            obj.dir = obj.dir.replace("{dirname}", baseDir);
        }
        let route: Route = new Route(obj.name, obj.template, obj.dir, m, obj.includeSubDir);
        this.routes.push(route);
    }

    public load(fileName: string, baseDir?: string): void {
        fs.readFile(fileName, "utf-8", (err: NodeJS.ErrnoException, data: string) => {
            let obj = JSON.parse(data);
            if (Array.isArray(obj)) {
                obj.forEach(element => {
                    this.addRoute(element, baseDir);
                });
            } else {
                this.addRoute(obj, baseDir);
            }
        });
    }

}