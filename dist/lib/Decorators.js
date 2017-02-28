"use strict";
function Inject(dependencyKey) {
    return function (target, propertyKey) {
        let value = target.reqCon.dependencies.get(dependencyKey);
        Reflect.set(target, propertyKey, value);
    };
}
exports.Inject = Inject;
