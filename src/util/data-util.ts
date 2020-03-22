function getKAID (): string {
	// window["./javascript/page-template-package/infra-entry.js"] = {"kaid":"kaid_757721856896775939251306","miniProfilerRequestId":null}
	if (window.hasOwnProperty("./javascript/page-template-package/infra-entry.js")) {
		// tslint:disable-next-line:no-any
		return (window as any)["./javascript/page-template-package/infra-entry.js"].kaid as string;
	}
	throw new Error("Can't find KAID. Infra Entry not loaded.");
}

export { getKAID };
