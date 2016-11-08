/// <reference path="/usr/local/lib/typings/index.d.ts" />

import * as express from "express";

import Controller from "./Controller";
import RequestContainer from "./RequestContainer";

export interface IClass<T> {
	new (): T;
}

interface IControllerFactory {
	(): Controller;
}

export default class ControllerContainer {

	name: string;

	actionMap: Map<string, any> = new Map<string, any>();
	generate: IControllerFactory;

	bind(controller: IClass<Controller>): void {
		this.generate = function (): Controller {
			return new controller();
		};
		let c = this.generate();

		let keys: (string | number | symbol)[] = Reflect.ownKeys(controller.prototype);
		keys.forEach((k) => {
			if (k && k !== "constructor" && !(<string>k).startsWith('$')) {
				let o = Reflect.get(c, k);
				if (typeof o === "function") {
					this.actionMap.set(k.toString().toLowerCase(), o);
				}
			}
		});
	}

	getAction(method: string, actionName: string): any {
		method = method.toLowerCase();
		let action: any = null;
		if (actionName) {
			actionName = actionName.toLowerCase();
			action = this.actionMap.get(method + "_" + actionName);
			if (!action) {
				action = this.actionMap.get(actionName);
			}
		} else {
			action = this.actionMap.get(method);
		}
		return action;
	}

	async executeNext(reqCon: RequestContainer, next: express.NextFunction, index?: number): Promise<express.NextFunction> {
		let fnc: express.RequestHandler = null;
		let nxt: express.NextFunction = null;
		if (!index) {
			index = 0;
		}
		if (reqCon.controller.filters.length && reqCon.controller.filters.length > index) {
			fnc = reqCon.controller.filters[index];
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

	async handle(reqCon: RequestContainer): Promise<void> {
		Object.assign(reqCon.req.params, reqCon.req.query);
		reqCon.set('request', reqCon.req);
		reqCon.set('response', reqCon.res);
		let controller = this.generate();
		controller.reqCon = reqCon;
		reqCon.controller = controller;
		controller.$init();

		let func = async (err?: any) => {
			if (err)
				throw err;
			let result: any = await Reflect.apply(reqCon.action, controller, [reqCon.req.params, reqCon.req.body]);
			if (result == null || result === undefined) {
				if (!reqCon.res.finished) {
					reqCon.res.send();
				}
			} else if (reqCon.req.accepts("json")) {
				reqCon.res.json(result);
			} else if (reqCon.req.accepts("html")) {
				let viewName = reqCon.controllerName + "/" + reqCon.actionName;
				reqCon.res.render(viewName, result, null);
			} else {
				reqCon.res.send(result);
			}
		}
		await this.executeNext(reqCon, func);
	}

}