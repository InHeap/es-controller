/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");
import RequestContainer from "./RequestContainer";

export default class {
	reqCon: RequestContainer = null;

	$init(): void {
	}

	$get(key: string): any {
		if (this.reqCon) {
			return this.reqCon.get(key);
		} else {
			return null;
		}
	}

	protected $view(args?: any, viewName?: string): View {
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
