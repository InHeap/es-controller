"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DependencyContainer {
    constructor() {
        this.instanceMap = new Map();
    }
    generate(constructor, args) {
        function F() {
            constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    }
    registerSingletonClass(constructor, ...paramCons) {
        let params = new Array();
        for (let i = 0; i < paramCons.length; i++) {
            params.push(this.get(paramCons[i]));
        }
        let obj = this.generate(constructor, params);
        this.instanceMap.set(constructor.name, obj);
    }
    registerClass(constructor, ...paramCons) {
        let createFunc = () => {
            let params = new Array();
            for (let i = 0; i < paramCons.length; i++) {
                params.push(this.get(paramCons[i]));
            }
            return this.generate(constructor, params);
        };
        this.instanceMap.set(constructor.name, createFunc);
    }
    set(name, value) {
        this.instanceMap.set(name, value);
    }
    get(key) {
        if (typeof key === 'string') {
            return this.instanceMap.get(key);
        }
        else {
            let obj = this.instanceMap.get(key.name);
            if (obj && typeof obj === 'function') {
                return obj();
            }
        }
    }
}
exports.default = DependencyContainer;
