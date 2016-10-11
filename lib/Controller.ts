/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");
import RequestContainer from "./RequestContainer";

export default class {
	reqCon: RequestContainer = null;
	filters: Array<express.RequestHandler> = new Array();

	init(reqCon: RequestContainer): void {
		this.reqCon = reqCon;
	}

	getDependency(key: string): any {
		return this.reqCon.dependencies.get(key);
	}

	constructor() { }

	protected view(args?: any, viewName?: string): View {
		return new View(viewName, args);
	}

}

export class View {
	viewName: string = "";
	args: any = null;

	constructor(viewName?: string, args?: any) {
		this.viewName = viewName;
		this.args = args;
	}
}
