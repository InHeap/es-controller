/// <reference path="/usr/local/lib/typings/index.d.ts" />

import * as fs from "fs";
import * as express from "express";

import RequestContainer from "./RequestContainer";
import Route from "./Route";
import DependencyContainer from "./DependencyContainer";

export default class Router {
	routes: Route[] = new Array<Route>();

	dependencies: DependencyContainer = new DependencyContainer();
	filters: Array<express.RequestHandler> = new Array();

	constructor(app?: express.Application) {
		if (app) {
			this.setApp(app);
		}
	}

	public set(key: any, value: any) {
		this.dependencies.set(key, value);
	}

	public get(key: any) {
		return this.dependencies.get(key);
	}

	public setApp(app: express.Application) {
		app.set("Router", this);
		app.use(this.handler);
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
		if (obj) {
			for (let k of Object.keys(obj)) {
				strMap.set(k, obj[k]);
			}
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

	async executeNext(reqCon: RequestContainer, next: express.NextFunction, index?: number): Promise<express.NextFunction> {
		let fnc: express.RequestHandler = null;
		let nxt: express.NextFunction = null;
		if (!index) {
			index = 0;
		}
		if (this.filters.length && this.filters.length > index) {
			fnc = this.filters[index];
			nxt = async (err?: any) => {
				if (err)
					throw err;
				await this.executeNext(reqCon, next, index + 1);
			};
		} else {
			fnc = async (req, res, next) => {
				await next();
			};
			nxt = next;
		}
		return await fnc(reqCon.req, reqCon.res, nxt);
	}

	public async handler(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
		let app = req.app
		let that: this = app.get("Router");
		try {
			for (let i = 0; i < that.routes.length; i++) {
				let route: Route = that.routes[i];
				let reqCon: RequestContainer = route.match(req);
				if (reqCon.match) {
					reqCon.router = that;
					reqCon.req = req;
					reqCon.res = res;
					let func = async (err?: any) => {
						if (err)
							throw err;
						await route.handle(reqCon);
					}
					await that.executeNext(reqCon, func);
					break;
				}
			}
			next();
		} catch (err) {
			next(err);
		}
	}

}