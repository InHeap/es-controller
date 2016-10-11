/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express-serve-static-core/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/serve-static/index.d.ts" />


import fs = require("fs");
import express = require("express");

import RequestContainer from "./RequestContainer";
import Route from "./Route";

export default class {
	routes: Route[] = new Array<Route>();
	app: express.Application = null;
	dependencies: Map<string, any> = new Map<string, any>();

	constructor(app?: express.Application) {
		this.setApp(app);
	}

	setDependency(key: string, value: any) {
		this.dependencies.set(key, value);
	}

	public setApp(app?: express.Application) {
		if (app) {
			this.app = app;
			app.set("Router", this);
			app.use(this.handler);
		}
	}


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

	public async handler(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
		let app = req.app
		let that: this = app.get("Router");
		for (let i = 0; i < that.routes.length; i++) {
			let route: Route = that.routes[i];
			let reqCon: RequestContainer = route.match(req);
			if (reqCon.match) {
				reqCon.dependencies = that.dependencies;
				await route.handle(req, res, reqCon);
				break;
			}
		}
		next();
	}

}