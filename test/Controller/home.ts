import * as es from "./../../index";

// Will set Controller Name as "Home"
export class Home extends es.Controller {

	@es.Decorators.Inject("Context")
	context:string=null;
	// Will be translated to get("/Home/index") (HTTP-method is extracted by first item in function name)
	get_index() {
		return this.view({
			title: "Title",
			message: "Hello"
		});
	}

	// Will be translated to ("/Home/index") for all methods.
	// Note: specified method request will have greater priority
	index() {
		return "Returning Index request for all methods";
	}

	// Will be translated to get("/Home") when no action is found.
	// Note: specified method with action request will have greater priority
	get() {
		return {
			title: "Title",
			message: "Hello"
		};
	}

	// Will be translated to post("/Home") when no action is found.
	// Note: specified method with action request will have greater priority
	post() {
		return "Post Response has been created";
	}
}
