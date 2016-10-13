/// <reference path="/usr/local/lib/typings/globals/node/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/express-serve-static-core/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/serve-static/index.d.ts" />
/// <reference path="/usr/local/lib/typings/globals/mime/index.d.ts"" />
/// <reference path="/usr/local/lib/typings/globals/xregexp/index.d.ts" />

import fs = require("fs");
import path = require("path");
import express = require("express");
import xregexp = require("xregexp");

import Controller from "./Controller";
import ControllerContainer, { IClass } from "./ControllerContainer";
import RequestContainer from "./RequestContainer";

export default class {
  name: string;
  template: string;
  dir: string;
  defaults: Map<string, string>;
  includeSubDir: boolean;
  filters: Array<express.RequestHandler> = new Array();

  private regex: string;
  private templateParams: Array<string> = new Array<string>();
  private templateregex: RegExp = xregexp("{(?<identifier>\\w+)}", "g");
  private reg: RegExp;
  private controllerMap: Map<string, ControllerContainer> = new Map<string, ControllerContainer>();

  constructor(name: string, template: string, dir: string, defaults: Map<string, string>, includeSubDir: boolean) {
    this.name = name;
    this.template = template;
    this.dir = dir;
    this.defaults = defaults;
    this.includeSubDir = includeSubDir;
    this.bind(this.dir, this.includeSubDir);
  }

  // Binding Controller
  bind(dir: string, includeSubDir: boolean): void {
    let fileNames = this.fileList(dir, includeSubDir);
    for (let i = 0; i < fileNames.length; i++) {
      let filename = fileNames[i];
      if (filename.endsWith(".js")) {
        let m = require(filename);
        let keys: (string | number | symbol)[] = Reflect.ownKeys(m);
        keys.forEach((k: (string | number | symbol)) => {
          let c = Reflect.get(m, k);
          this.bindController(k.toString(), c);
        });
      }
    }
    this.setTemplate(this.template);
  }

  private bindController(controllerName: string, controller: IClass<Controller>): void {
    if (typeof controller === "function") {
      let t = new controller();
      if (t instanceof Controller) {
        let c = new ControllerContainer();
        c.bind(controller);
        this.controllerMap.set(controllerName.toLowerCase(), c);
      }
    }
  }

  private fileList(dir: string, includeSubDir: boolean): string[] {
    let files: string[] = fs.readdirSync(dir);
    let fileNames: string[] = new Array<string>();
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let name = path.join(dir, file);
      let stats: fs.Stats = fs.statSync(name);
      if (stats.isDirectory()) {
        if (includeSubDir) {
          fileNames = fileNames.concat(this.fileList(name, includeSubDir));
        }
      } else {
        fileNames.push(name);
      }
    }
    return fileNames;
  }

  setTemplate(template: string): void {
    this.template = template;
    let urlregexStr: string = "";
    let words = this.template.split("/");
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      if (word) {
        if (xregexp.test(word, this.templateregex)) {
          let param: string = xregexp.exec(word, this.templateregex)["identifier"];
          if (param && param !== "controller" && param !== "action") {
            this.templateParams.push(param);
          }
          // if (this.defaults.has(param)) {
          urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w*)");
          // } else {
          // urlregexStr += "/*" + xregexp.replace(word, this.templateregex, "(?<${identifier}>\\w+)");
          // }
        } else {
          urlregexStr += "/" + word;
        }
      }
    }
    this.reg = xregexp(urlregexStr, "g");
  }

  match(req: express.Request): RequestContainer {
    let reqCon: RequestContainer = new RequestContainer();

    // Check for template regular expression
    if (!xregexp.test(req.url, this.reg)) {
      return reqCon;
    }
    reqCon.parts = xregexp.exec(req.url, this.reg);

    // Check Controller
    if (reqCon.parts["controller"]) {
      reqCon.controllerName = reqCon.parts["controller"];
    } else if (this.defaults.get("controller")) {
      reqCon.controllerName = this.defaults.get("controller");
    }
    if (reqCon.controllerName) {
      reqCon.controller = this.controllerMap.get(reqCon.controllerName.toLowerCase());
    }
    if (!reqCon.controller) {
      return reqCon;
    }

    // Check Action
    if (reqCon.parts["action"]) {
      reqCon.actionName = reqCon.parts["action"];
    } else if (this.defaults.get("action")) {
      reqCon.actionName = this.defaults.get("action");
    }
    reqCon.action = reqCon.controller.getAction(req.method, reqCon.actionName);
    if (!reqCon.action) {
      return reqCon;
    }

    reqCon.match = true;
    return reqCon;
  }

  public async handle(req: express.Request, res: express.Response, reqCon: RequestContainer): Promise<any> {
    reqCon.req = req;
    reqCon.res = res;
    // Setting Request Parameters
    for (let i = 0; i < this.templateParams.length; i++) {
      let x = this.templateParams[i];
      if (reqCon.parts[x]) {
        req.params[x] = reqCon.parts[x];
      } else {
        req.params[x] = this.defaults.get(x);
      }
    }
    return await reqCon.controller.handle(reqCon);
  }

}