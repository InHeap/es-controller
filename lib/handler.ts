/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express-serve-static-core/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/serve-static/index.d.ts" />

import express = require("express");

import RequestContainer from "./RequestContainer";
import Route from "./Route";
import Router from "./Router";

export default async function (req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
  for (let i = 0; i < router.routes.length; i++) {
    let route: Route = router.routes[i];
    let reqCon: RequestContainer = route.match(req);
    if (reqCon.match) {
      await route.handle(req, res, reqCon);
      break;
    }
  }
	next();
}

export var router: Router = new Router();
