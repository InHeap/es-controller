import * as express from "express";
import ControllerContainer from "./ControllerContainer";
import Controller from "./Controller";
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
	controllerContainer: ControllerContainer = null;
	controller: Controller = null;
	actionName: string = "";
	action: any = null;

	get(key: any): any {
		let res: any = null;
		if (typeof key === 'string') {
			res = this.dependencies.get(key.toLowerCase());
		}
		if (!res) {
			res = this.router.get(key);
		}
		return res;
	}

	set(key: string, value: any) {
		this.dependencies.set(key.toLowerCase(), value);
	}
}