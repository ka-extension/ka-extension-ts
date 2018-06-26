import { MessageTypes, Message } from "./types/message-types";
import { EXTENSION_ID, CSRF_HEADER, COOKIE } from "./types/names";
import { getChromeFkey, getChromeCookies } from "./util/cookie-util";
import { NotifObj } from "./types/data";

console.log(chrome.runtime.id === EXTENSION_ID);

chrome.runtime.onMessageExternal.addListener((arg: any, sender: chrome.runtime.MessageSender) => {
	console.log("External Message: ", arg);
	arg = arg as Message;
	switch (arg.type) {
		case MessageTypes.DOWNLOAD:
			chrome.downloads.download(arg.message as chrome.downloads.DownloadOptions);
			break;
	}
});


chrome.runtime.onMessage.addListener((arg: any, sender: chrome.runtime.MessageSender) => {
	console.log("Internal Message: ", arg);
	arg = arg as Message;
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

setInterval(() => {
	getChromeFkey().then(fkey => {
		fetch(`https://www.khanacademy.org/api/internal/user/notifications/readable?limit=100`, {
			method: 'GET',
			headers: {
				[CSRF_HEADER]: fkey.toString(),
				[COOKIE]: getChromeCookies()
			},
			credentials: "same-origin"
		}).then((res: Response): (Promise<NotifObj> | NotifObj) => {
			return res.json();
		}).then((data: NotifObj): void => {
			const notifs: number = data.notifications.reduce((prev, curr) => {
				return prev + (curr.brand_new ? 1 : 0);
			}, 0);
			if (notifs > 0){
				chrome.browserAction.setBadgeText({
					text: notifs > 9 ? "9+" : notifs.toString()
				});
				return;
			}
			chrome.browserAction.setBadgeText({
				text: ""
			});
		});
	}).catch(console.error);
}, 150);
