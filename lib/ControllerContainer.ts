/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");

import Controller, { View } from "./Controller";
import RequestContainer from "./RequestContainer";

export interface IClass<T> {
	new (): T;
}

interface IControllerFactory {
	(): Controller;
}

export default class {

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

	async handle(reqCon: RequestContainer): Promise<void> {
		Object.assign(reqCon.req.params, reqCon.req.query);
		reqCon.set('request', reqCon.req);
		reqCon.set('response', reqCon.res);
		let controller = this.generate();
		controller.reqCon = reqCon;
		controller.$init();
		let result: any = await Reflect.apply(reqCon.action, controller, [reqCon.req.params, reqCon.req.body]);
		if (!result) {
			reqCon.res.send();
		} else if (result instanceof View) {
			if (!result.viewName) {
				result.viewName = reqCon.controllerName + "/" + reqCon.actionName;
			}
			reqCon.res.render(result.viewName, result.args, null);
		} else if (reqCon.req.accepts("json")) {
			reqCon.res.json(result);
		} else if (reqCon.req.accepts("html")) {
			let viewName = reqCon.controllerName + "/" + reqCon.actionName;
			reqCon.res.render(viewName, result, null);
		} else {
			reqCon.res.send(result);
		}
	}

}