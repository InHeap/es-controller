/// <reference path="./../typings/main/ambient/node/index.d.ts" />
/// <reference path="./../typings/main/ambient/express/index.d.ts" />
/// <reference path="./../typings/main/ambient/express-serve-static-core/index.d.ts" />
/// <reference path="./../typings/main/ambient/serve-static/index.d.ts" />
"use strict";
const Router_1 = require("./Router");
function default_1(req, res, next) {
    for (let i = 0; i < exports.router.routes.length; i++) {
        let route = exports.router.routes[i];
        let reqCon = route.match(req);
        if (reqCon.match) {
            let p = route.handle(req, res, reqCon);
            p.then(next);
            break;
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
exports.router = new Router_1.default();
