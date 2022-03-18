import { MessageTypes, Message } from "./types/message-types";
import { CSRF_HEADER } from "./types/names";
import { getChromeFkey, getChromeCookies } from "./util/cookie-util";
import queries from "./graphqlQueries.json";

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
	getChromeFkey().then(fkey => {
		return fetch("https://www.khanacademy.org/api/internal/graphql/getFullUserProfile", {
			method: "POST",
			headers: {
				[CSRF_HEADER]: fkey,
				"content-type": "application/json"
			},
			body: JSON.stringify({
				operationName: "getFullUserProfile",
				query: queries.user,
				variables: {},
			}),
			credentials: "same-origin"
		}).then(e => {
			return e.json();
		});
	}).then(data => {
		const count = data.data.user.newNotificationCount;

		chrome.browserAction.setBadgeText({
			text: count > 0 ? count.toString() : ""
		});
	}).catch(console.error);
}, 750);

chrome.webNavigation.onHistoryStateUpdated.addListener(e => {
	console.log("URL CHANGE", e);
	chrome.tabs.sendMessage(e.tabId, { type: MessageTypes.PAGE_UPDATE });
});
