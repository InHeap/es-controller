import Controller from "./Controller";

export function Inject(dependencyKey: string) {
	return function (target: any, propertyKey: string) {
		let value = (<Controller>target).reqCon.dependencies.get(dependencyKey);
		Reflect.set(target, propertyKey, value);
	}
}
