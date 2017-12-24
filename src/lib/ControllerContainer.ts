import * as koa from "koa";

import Controller from "./Controller";
import RequestContainer from "./RequestContainer";

export interface IClass<T> {
	new(): T;
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
			if (k && (<string>k).startsWith('$')) {
				let o = Reflect.get(c, k);
				if (typeof o === "function") {
					this.actionMap.set(k.toString().substring(1).toLowerCase(), o);
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

	async	executeNext(reqCon: RequestContainer, next: () => Promise<any>, index?: number) {
		let fnc: koa.Middleware = null;
		let nxt: () => Promise<any> = null;
		if (!index) {
			index = 0;
		}
		if (reqCon.controller.filters.length && reqCon.controller.filters.length > index) {
			fnc = reqCon.controller.filters[index];
			nxt = async (err?: any) => {
				if (err)
					throw err;
				this.executeNext(reqCon, next, index + 1);
			};
		} else {
			fnc = (ctx, next) => {
				next();
			};
			nxt = next;
		}
		return fnc(reqCon.ctx, nxt);
	}

	async handle(reqCon: RequestContainer): Promise<void> {
		let controller = this.generate();
		controller.controllerName = reqCon.controllerName;
		controller.actionName = reqCon.actionName;
		controller.ctx = reqCon.ctx;
		controller.request = reqCon.ctx.request;
		controller.body = (<koa.Request & { body: any; }>reqCon.ctx.request).body;
		reqCon.controller = controller;

		let func = async (err?: any) => {
			if (err)
				throw err;

			await controller.init();
			let result: any = await Reflect.apply(reqCon.action, controller,
				[reqCon.ctx.params, reqCon.ctx.query, reqCon.ctx.body]);

			if (result == null || result === undefined) {
				// Do nothing and pass to next function
			} else if (reqCon.ctx.accepts("json")) {
				reqCon.ctx.body = result;
			} else if (reqCon.ctx.accepts("html")) {
				controller.view(result);
			} else {
				reqCon.ctx.body = result;
			}
		}
		await this.executeNext(reqCon, func);
	}

}