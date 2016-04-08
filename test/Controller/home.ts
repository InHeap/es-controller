import * as es from "./../../index";

// Will set Controller Name as "Home"
export class Home extends es.Controller {

    // Will be translated to get("/Home/index") (HTTP-method is extracted by first item in function name)
    get_index() {
        this.res.send("Returning Get Index request");
    }

    // Will be translated to ("/Home/index") for all methods.
    // Note: specified method request will have greater priority
    index() {
        this.res.send("Returning Index request for all methods");
    }

    // Will be translated to get("/Home") when no action is found.
    // Note: specified method with action request will have greater priority
    get() {
        this.res.send("Get Response has been created");
    }

    // Will be translated to post("/Home") when no action is found.
    // Note: specified method with action request will have greater priority
    post() {
        this.res.send("Post Response has been created");
    }
}
