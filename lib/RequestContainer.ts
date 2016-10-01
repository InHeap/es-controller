/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");
import ControllerContainer from "./ControllerContainer";

export default class {
	req: express.Request = null;
	res: express.Response = null;
	match: boolean = false;
	parts: RegExpExecArray = null;
	controllerName: string = "";
	controller: ControllerContainer = null;
	actionName: string = "";
	action: any = null;
}