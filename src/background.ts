import { MessageTypes, Message } from "./types/message-types";
import { CSRF_HEADER, COOKIE, EXTENSION_ID } from "./types/names";
import { getChromeFkey, getChromeCookies } from "./util/cookie-util";
import { UserProfileData } from "./types/data";

let kaid: string;

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
		case MessageTypes.KAID:
			kaid = arg.message.kaid;
			break;
	}
});

chrome.browserAction.setBadgeBackgroundColor({
	color: "#35c61b"
});

setInterval((): void => {
	if (!kaid){ return; }

	getChromeFkey().then(fkey => {
<<<<<<< HEAD
		fetch(`https://www.khanacademy.org/api/internal/user/profile?kaid=${kaid}&projection=${JSON.stringify({
			countBrandNewNotifications: 1
		})}`, {
=======
		fetch(`https://www.khanacademy.org/api/internal/user/notifications/readable`, {
>>>>>>> 66dd26b73632d0a07b9cc9fb74d20cf8423e19b9
			method: 'GET',
			headers: {
				[CSRF_HEADER]: fkey.toString(),
				[COOKIE]: getChromeCookies()
			},
			credentials: "same-origin"
		})
		.then(res => res.json())
		.then(data => data as UserProfileData)
		.then(data => {
			if(data.countBrandNewNotifications > 0){
				chrome.browserAction.setBadgeText({
					text: data.countBrandNewNotifications.toString()
				});
				return;
			}
			chrome.browserAction.setBadgeText({
				text: ""
			});
		}).catch(console.error);
	}).catch(console.error);
<<<<<<< HEAD

}, 750);
=======
}, 1000);
>>>>>>> 66dd26b73632d0a07b9cc9fb74d20cf8423e19b9
