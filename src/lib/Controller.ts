import * as koa from "koa";
import RequestContainer from "./RequestContainer";

export default class Controller {
	reqCon: RequestContainer = null;
	ctx: koa.Context & { params?, render?} = null;
	// filters: Array<express.RequestHandler> = new Array();

	async init(): Promise<void> {
	}

	// get(key: string): any {
	// 	if (this.reqCon) {
	// 		return this.reqCon.get(key);
	// 	} else {
	// 		return null;
	// 	}
	// }

	protected view(args?: any, viewName?: string) {
		if (!viewName) {
			viewName = this.reqCon.controllerName + "/" + this.reqCon.actionName;
		}
		this.ctx.render(viewName, args);
	}

}
