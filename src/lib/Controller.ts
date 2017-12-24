import * as koa from "koa";
import RequestContainer, { Context } from "./RequestContainer";

export default class Controller {
	ctx: Context = null;
	request: koa.Request = null;
	body = null;
	controllerName: string = null;
	actionName: string = null;
	filters: Array<koa.Middleware> = new Array();

	init() {
	}

	// get(key: string): any {
	// 	if (this.reqCon) {
	// 		return this.reqCon.get(key);
	// 	} else {
	// 		return null;
	// 	}
	// }

	view(args?: any, viewName?: string) {
		if (!viewName) {
			viewName = this.controllerName + "/" + this.actionName;
		}
		this.ctx.render(viewName, args);
	}

}
