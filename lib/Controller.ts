/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");
import RequestContainer from "./RequestContainer";

export default class {
	reqCon: RequestContainer = null;

	init(reqCon: RequestContainer): void {
		this.reqCon = reqCon;
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
