/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />

import express = require("express");

export default class {
	req: express.Request;
	res: express.Response;

	init(req: express.Request, res: express.Response): void {
		this.req = req;
		this.res = res;
	}

	constructor() { }
}