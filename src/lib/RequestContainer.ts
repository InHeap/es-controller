import * as koa from "koa";

import ControllerContainer from "./ControllerContainer";
import Controller from "./Controller";
import Router from "./Router";
import DependencyContainer from "./DependencyContainer";


export interface Context extends koa.Context {
	params: any;
	render: Function;
}

export default class {
	// dependencies: DependencyContainer = new DependencyContainer();
	ctx: Context = null;
	parts: RegExpExecArray = null;
	controllerName: string = "";
	controllerContainer: ControllerContainer = null;
	actionName: string = "";
	action: any = null;

	// get(key: any): any {
	// 	let res: any = null;
	// 	if (typeof key === 'string') {
	// 		res = this.dependencies.get(key.toLowerCase());
	// 	}
	// 	if (!res) {
	// 		res = this.router.get(key);
	// 	}
	// 	return res;
	// }

	// set(key: string, value: any) {
	// 	this.dependencies.set(key.toLowerCase(), value);
	// }
}