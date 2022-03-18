import { MessageTypes, KAID_MESSAGE, Message } from "./types/message-types";

(() => {
	console.log("content.js fired");

	const scriptTag: HTMLScriptElement = <HTMLScriptElement>document.createElement("script");
	const firstScriptTag: HTMLScriptElement = <HTMLScriptElement>document.getElementsByTagName("script")[0];
	scriptTag.src = chrome.extension.getURL("./dist/index.js");
	scriptTag.id = "ka-extension-script";
	scriptTag.type = "text/javascript";
	firstScriptTag!.parentNode!.insertBefore(scriptTag, firstScriptTag);

	const style: HTMLLinkElement = <HTMLLinkElement>document.createElement("link");
	style.rel = "stylesheet";
	style.type = "text/css";
	style.href = chrome.extension.getURL("styles/general.css");
	const root = document.head || document.documentElement;
	if (root) { root.appendChild(style); }

	chrome.runtime.sendMessage({
		type: MessageTypes.COLOUR_ICON
	});

	window.addEventListener("beforeunload", () => {
		chrome.runtime.sendMessage({
			type: MessageTypes.GREY_ICON,
		});
	});

	chrome.runtime.onMessage.addListener((arg: Message) => {
		window.postMessage(arg);
	});
})();
