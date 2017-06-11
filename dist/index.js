"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = require("./lib/Controller");
exports.Controller = Controller_1.default;
const Route_1 = require("./lib/Route");
exports.Route = Route_1.default;
const Router_1 = require("./lib/Router");
exports.Router = Router_1.default;
const Decorators = require("./lib/Decorators");
exports.Decorators = Decorators;
function default_1(fileName, baseDir) {
    let r = new Router_1.default(fileName, baseDir);
    return (ctx, next) => {
        return r.handler(ctx, next);
    };
}
exports.default = default_1;
