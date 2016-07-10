"use strict";
const Router_1 = require("./Router");
function default_1(req, res, next) {
    let match = false;
    for (let i = 0; i < exports.router.routes.length; i++) {
        let route = exports.router.routes[i];
        let reqCon = route.match(req);
        if (reqCon.match) {
            match = true;
            let p = route.handle(req, res, reqCon);
            p.then(next);
            break;
        }
    }
    if (!match) {
        next();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
exports.router = new Router_1.default();
