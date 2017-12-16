import * as fs from "fs";
import * as path from "path";
import * as koa from "koa";
import * as xregexp from "xregexp";
import * as moment from 'moment';

import Controller from "./Controller";
import ControllerContainer, { IClass } from "./ControllerContainer";
import RequestContainer from "./RequestContainer";

export default class Route {
  name: string;
  template: string;
  dir: string;
  defaults: Map<string, string>;
  includeSubDir: boolean;
  // filters: Array<express.RequestHandler> = new Array();
  types: Map<string, string>;

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
          if (k === 'default') {
            k = filename.match(/(?!.*\/|\\)(\w*)/g)[0];
          }
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
        controllerName = controllerName.replace('Controller', '')
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

  match(ctx: koa.Context): RequestContainer {
    let reqCon = new RequestContainer();

    // Check for template regular expression
    if (!xregexp.test(ctx.url, this.reg)) {
      return null;
    }
    reqCon.parts = xregexp.exec(ctx.url, this.reg);

    // Check Controller
    if (reqCon.parts["controller"]) {
      reqCon.controllerName = reqCon.parts["controller"];
    } else if (this.defaults.get("controller")) {
      reqCon.controllerName = this.defaults.get("controller");
    }
    if (reqCon.controllerName) {
      reqCon.controllerContainer = this.controllerMap.get(reqCon.controllerName.toLowerCase());
    }
    if (!reqCon.controllerContainer) {
      return null;
    }

    // Check Action
    if (reqCon.parts["action"]) {
      reqCon.actionName = reqCon.parts["action"];
    } else if (this.defaults.get("action")) {
      reqCon.actionName = this.defaults.get("action");
    }
    reqCon.action = reqCon.controllerContainer.getAction(ctx.method, reqCon.actionName);
    if (!reqCon.action) {
      return null;
    }

    return reqCon;
  }

  // async executeNext(reqCon: RequestContainer, next: express.NextFunction, index?: number): Promise<express.NextFunction> {
  //   let fnc: express.RequestHandler = null;
  //   let nxt: express.NextFunction = null;
  //   if (!index) {
  //     index = 0;
  //   }
  //   if (this.filters.length && this.filters.length > index) {
  //     fnc = this.filters[index];
  //     nxt = async (err?: any) => {
  //       if (err)
  //         throw err;
  //       await this.executeNext(reqCon, next, index + 1);
  //     };
  //   } else {
  //     fnc = async (req, res, next) => {
  //       await next();
  //     };
  //     nxt = next;
  //   }
  //   return await fnc(reqCon.req, reqCon.res, nxt);
  // }

  public async handle(reqCon: RequestContainer): Promise<any> {
    // Setting Request Parameters
    reqCon.ctx.params = {};
    for (let i = 0; i < this.templateParams.length; i++) {
      let x = this.templateParams[i];
      if (reqCon.parts[x]) {
        let temp = reqCon.parts[x];
        let param = null;
        if (this.types.get(param).toLowerCase() == 'bool') {
          param = Boolean(param);
        } else if (this.types.get(param).toLowerCase() == 'int') {
          param = Number.parseInt(param);
        } else if (this.types.get(param).toLowerCase() == 'float') {
          param = Number.parseFloat(param);
        } else if (this.types.get(param).toLowerCase() == 'date') {
          param = moment(param).toDate();
        } else {
          param = temp;
        }
        reqCon.ctx.params[x] = param;
      } else {
        reqCon.ctx.params[x] = this.defaults.get(x);
      }
    }
    // let func = async (err?: any) => {
    //   if (err)
    //     throw err;
    return await reqCon.controllerContainer.handle(reqCon);
    // }
    // await this.executeNext(reqCon, func);
  }

}
