/// <reference path="./../typings/main/ambient/node/index.d.ts" />
/// <reference path="./../typings/main/ambient/express/index.d.ts" />
/// <reference path="./../typings/main/ambient/express-serve-static-core/index.d.ts" />
/// <reference path="./../typings/main/ambient/serve-static/index.d.ts" />

import express = require("express");

import RequestContainer from "./RequestContainer";
import Route from "./Route";
import Router from "./Router";

export default function(req: express.Request, res: express.Response, next: express.NextFunction): any {
    for (let i = 0; i < router.routes.length; i++) {
        let route: Route = router.routes[i];
        let reqCon: RequestContainer = route.match(req);
        if (reqCon.match) {
            let p = route.handle(req, res, reqCon);
            p.then(next);
            break;
        }
    }
}

export var router: Router = new Router();
