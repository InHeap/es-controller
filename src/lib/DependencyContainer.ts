interface IClass<T> {
  new (...param: Array<any>): T;
}

interface IClassFactory<T> {
  (): T;
}

class DependencyContainer {
  instanceMap: Map<string, any> = new Map<string, any>();

  generate(constructor: IClass<any>, args: any) {
    function F(): void {
      constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
  }

  registerSingletonClass(constructor: IClass<any>, ...paramCons: Array<IClass<any>>): void {
    let params: Array<any> = new Array<any>();
    for (let i = 0; i < paramCons.length; i++) {
      params.push(this.get(paramCons[i]));
    }

    let obj = this.generate(constructor, params);
    this.instanceMap.set(constructor.name, obj);
  }

  registerClass(constructor: IClass<any>, ...paramCons: Array<IClass<any>>): void {
    let createFunc = (): any => {
      let params: Array<any> = new Array<any>();
      for (let i = 0; i < paramCons.length; i++) {
        params.push(this.get(paramCons[i]));
      }
      return this.generate(constructor, params);
    };
    this.instanceMap.set(constructor.name, createFunc);
  }

  set(name: string, value: any): void {
    this.instanceMap.set(name, value);
  }

  get(key: IClass<any> | string): any {
    if (typeof key === 'string') {
      return this.instanceMap.get(key);
    } else {
      let obj = this.instanceMap.get(key.name);
      if (obj && typeof obj === 'function') {
        return obj();
      }
    }
  }

}

export default DependencyContainer;
