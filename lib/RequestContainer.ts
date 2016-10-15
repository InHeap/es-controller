/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");
import ControllerContainer from "./ControllerContainer";
import Router from "./Router";
import DependencyContainer from "./DependencyContainer";

export default class {
	router: Router = null;
	dependencies: DependencyContainer = new DependencyContainer();
	req: express.Request = null;
	res: express.Response = null;
	match: boolean = false;
	parts: RegExpExecArray = null;
	controllerName: string = "";
	controller: ControllerContainer = null;
	actionName: string = "";
	action: any = null;

	get(key: any): any {
		if (typeof key === 'string') {
			key = key.toLowerCase();
		}
		let res = this.dependencies.get(key);
		if (!res) {
			res = this.router.get(key);
		}
		return res;
	}

	set(key: string, value: any) {
		this.dependencies.set(key.toLowerCase(), value);
	}
}