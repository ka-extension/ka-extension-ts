class FileDownloader {
	private hyperlink: HTMLAnchorElement;

	constructor () {
		this.hyperlink = document.createElement("a");
		this.hyperlink.style.setProperty("display", "none");
	}

	downloadJSON (json: object, name: string, pretty: boolean = false) {
		const jsonString = pretty ? JSON.stringify(json, null, 4) : JSON.stringify(json);
		this.hyperlink.setAttribute("download", name);
		this.hyperlink.href = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
		document.body.appendChild(this.hyperlink);
		this.hyperlink.click();
		document.body.removeChild(this.hyperlink);
	}
}

export { FileDownloader };
