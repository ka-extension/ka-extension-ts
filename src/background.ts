import { MessageTypes, Message } from "./types/message-types";
import { getChromeFkey } from "./util/cookie-util";
import { getUserData } from "./util/graphql-util";

chrome.runtime.onMessage.addListener((arg: Message) => {
	console.log("Internal Message", arg);
	switch (arg.type) {
		case MessageTypes.COLOUR_ICON:
			chrome.browserAction.setIcon({
				path: "./images/colour/icon16.png"
			});
			break;
		case MessageTypes.GREY_ICON:
			chrome.tabs.query({
				url: "*://*.khanacademy.org/*"
			}, tabs => {
				if (tabs.length < 1) {
					chrome.browserAction.setIcon({
						path: "./images/grey/icon16.png"
					});
				}
			});
			break;
	}
});

chrome.browserAction.setBadgeBackgroundColor({
	color: "#35c61b"
});

setInterval((): void => {
	getChromeFkey().then(fkey => getUserData(undefined, fkey))
		.then(user => {
			const count = user.newNotificationCount;
			chrome.browserAction.setBadgeText({
				text: count && count > 0 ? count.toString() : ""
			});
		}).catch(console.error);
}, 60*1000);

chrome.webNavigation.onHistoryStateUpdated.addListener(e => {
	console.log("URL CHANGE", e);
	chrome.tabs.sendMessage(e.tabId, { type: MessageTypes.PAGE_UPDATE });
});
