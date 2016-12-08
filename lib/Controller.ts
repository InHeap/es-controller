/// <reference path="/usr/local/lib/typings/index.d.ts" />

import * as express from "express";
import RequestContainer from "./RequestContainer";

export default class Controller {
	reqCon: RequestContainer = null;
	// filters: Array<express.RequestHandler> = new Array();

	$init(): void {
	}

	$get(key: string): any {
		if (this.reqCon) {
			return this.reqCon.get(key);
		} else {
			return null;
		}
	}

	protected $view(args?: any, viewName?: string) {
		if (!viewName) {
			viewName = this.reqCon.controllerName + "/" + this.reqCon.actionName;
		}
		this.reqCon.res.render(viewName, args, null);
	}

	protected $response(response?: any, status?: number) {
		status = status ? status : 200;
		this.reqCon.res.status(status);
		this.reqCon.res.send(response);
	}

	protected $redirect(url: string, status?: number) {
		status = status ? status : 302;
		this.reqCon.res.redirect(status, url);
	}
}
