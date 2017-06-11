import Controller from "./lib/Controller";
import Route from "./lib/Route";
import Router from "./lib/Router";
import * as Decorators from "./lib/Decorators";
import { Context } from './lib/RequestContainer';

export { Controller };
export { Route };
export { Router };
export { Decorators };
export { Context };

export default function (fileName: string, baseDir?: string) {
	let r = new Router(fileName, baseDir);
	return (ctx, next) => {
		return r.handler(ctx, next);
	}
}
