/// <reference path="/usr/local/lib/typings/index.d.ts" />

import * as express from "express";
import RequestContainer from "./RequestContainer";

export default class Controller {
	reqCon: RequestContainer = null;
	filters: Array<express.RequestHandler> = new Array();

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

	protected $response(response?: any, status?: number) {
		return new Response(status, response)
	}

	protected $accept(response?: any, status?: number) {
		if (!status)
			status = 200;
		return new Response(status, response)
	}

	protected $reject(response?: any, status?: number) {
		if (!status)
			status = 400;
		return new Response(status, response)
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

export class Response {
	status: number = 200;
	body: any = null;

	constructor(status?: number, body?: any) {
		this.status = status;
		this.body = body;
	}
}
