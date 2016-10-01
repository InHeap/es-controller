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
			if (k && k !== "constructor") {
				let o = Reflect.get(c, k);
				if (typeof o === "function") {
					this.actionMap.set(k.toString(), o);
				}
			}
		});
	}

	getAction(method: string, actionName: string): any {
		method = method.toLowerCase();
		let action: any = null;
		if (actionName) {
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
		let controller = this.generate();
		controller.init(reqCon);
		let result: any = Reflect.apply(reqCon.action, controller, [reqCon.req, reqCon.res]);
		if (result instanceof View) {
			if (!result.viewName) {
				result.viewName = reqCon.controllerName + "/" + reqCon.actionName;
			}
			reqCon.res.render(result.viewName, result.args, null);
		} else {
			reqCon.res.send(result);
		}
	}

}