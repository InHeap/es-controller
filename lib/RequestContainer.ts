/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");
import ControllerContainer from "./ControllerContainer";

export default class {
	dependencies: Map<string, any> = null;
	req: express.Request = null;
	res: express.Response = null;
	match: boolean = false;
	parts: RegExpExecArray = null;
	controllerName: string = "";
	controller: ControllerContainer = null;
	actionName: string = "";
	action: any = null;

	get(key: string) {
		return this.dependencies.get(key.toLowerCase());
	}

	set(key: string, value: any) {
		this.dependencies.set(key.toLowerCase(), value);
	}
}