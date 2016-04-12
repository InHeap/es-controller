import ControllerContainer from "./ControllerContainer";

export default class {
    match: boolean = false;
    parts: RegExpExecArray = null;
    controller: ControllerContainer = null;
    action: any = null;
}