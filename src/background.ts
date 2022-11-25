import { MessageTypes, Message } from "./types/message-types";
import { NOTIF_TIMER_NAME } from "./types/names";
import { getChromeFkey } from "./util/cookie-util";
import { getUserData } from "./util/graphql-util";

const greenIcon = chrome.runtime.getURL("./images/colour/icon16.png");
const grayIcon = chrome.runtime.getURL("./images/grey/icon16.png");

chrome.action.setBadgeBackgroundColor({
	color: "#35c61b"
});

chrome.runtime.onMessage.addListener((arg: Message) => {
	console.log("Internal Message", arg);
	switch (arg.type) {
		case MessageTypes.COLOUR_ICON:
			chrome.action.setIcon({
				path: greenIcon
			});
			break;
		case MessageTypes.GREY_ICON:
			chrome.tabs.query({
				url: "*://*.khanacademy.org/*"
			}, tabs => {
				if (tabs.length < 1) {
					chrome.action.setIcon({
						path: grayIcon
					});
				}
			});
			break;
	}
});

chrome.webNavigation.onHistoryStateUpdated.addListener(e => {
	console.log("URL CHANGE", e);
	chrome.tabs.sendMessage(e.tabId, { type: MessageTypes.PAGE_UPDATE });
});

chrome.alarms.create(NOTIF_TIMER_NAME, {
	periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener(alarm => {
	console.log("Ran nofic check timer", Date.now());
	if (alarm.name === NOTIF_TIMER_NAME) {
		getChromeFkey().then(fkey => getUserData(undefined, {
			fkey, origin: "https://www.khanacademy.org"
		}))
			.then(user => {
				const count = user.newNotificationCount;
				chrome.action.setBadgeText({
					text: count && count > 0 ? count.toString() : ""
				});
			}).catch(console.error);
	}
});
