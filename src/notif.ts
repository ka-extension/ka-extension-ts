import { deleteNotif } from "./util/api-util";
import { urlUnencode } from "./util/text-util";
import { EXTENSION_MODIFIED_NOTIF, SVG_NAMESPACE, DELETE_BUTTON } from "./types/names";
import { querySelectorPromise } from "./util/promise-util";

const toSelect = `[class^=notification_ayl7f7]:not(.${EXTENSION_MODIFIED_NOTIF})`;

function deleteNotifButtons (): void {
	setInterval(() => Array.from(document.querySelectorAll(toSelect)).forEach(notif => {
		const innerLink = notif.getElementsByClassName("link_9objhk")[0] as HTMLAnchorElement;
		if (innerLink && innerLink.href.indexOf("/notifications") > 0) {
			const paramsString = innerLink.href.substr(innerLink.href.indexOf("?") + 1);
			const params = urlUnencode(paramsString);

			const deleteButton = document.createElement("span");
			deleteButton.className = DELETE_BUTTON;

			const deleteSVG = document.createElementNS(SVG_NAMESPACE, "svg");
			deleteSVG.setAttribute("width", "10");
			deleteSVG.setAttribute("height", "10");
			deleteSVG.setAttribute("viewBox", "0 0 21.9 21.9");
			deleteSVG.setAttribute("enable-background", "new 0 0 21.9 21.9");

			const deleteSVGPath = document.createElementNS(SVG_NAMESPACE, "path");
			deleteSVGPath.setAttribute("fill", "#000000");
			deleteSVGPath.setAttribute("d", "M14.1,11.3c-0.2-0.2-0.2-0.5,0-0.7l7.5-7.5c0.2-0.2,0.3-0.5,0.3-0.7s-0.1-0.5-0.3-0.7l-1.4-1.4C20,0.1,19.7,0,19.5,0  c-0.3,0-0.5,0.1-0.7,0.3l-7.5,7.5c-0.2,0.2-0.5,0.2-0.7,0L3.1,0.3C2.9,0.1,2.6,0,2.4,0S1.9,0.1,1.7,0.3L0.3,1.7C0.1,1.9,0,2.2,0,2.4  s0.1,0.5,0.3,0.7l7.5,7.5c0.2,0.2,0.2,0.5,0,0.7l-7.5,7.5C0.1,19,0,19.3,0,19.5s0.1,0.5,0.3,0.7l1.4,1.4c0.2,0.2,0.5,0.3,0.7,0.3  s0.5-0.1,0.7-0.3l7.5-7.5c0.2-0.2,0.5-0.2,0.7,0l7.5,7.5c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l1.4-1.4c0.2-0.2,0.3-0.5,0.3-0.7  s-0.1-0.5-0.3-0.7L14.1,11.3z");

			deleteSVG.appendChild(deleteSVGPath);
			deleteButton.appendChild(deleteSVG);

			deleteSVG.addEventListener("click", () => Promise.all(params.keys.map(deleteNotif))
				.then(() => notif.parentElement && notif.parentElement.removeChild(notif))
				.catch(console.error));

			notif.insertBefore(deleteButton, innerLink);
			notif.classList.add(EXTENSION_MODIFIED_NOTIF);
		}
	}), 100);
}

function updateNotifIndicator (): void {
	querySelectorPromise(".notificationsBadge_1j1j5ke")
		.then(greenCircle => {
			if (window.KA._userProfileData) {
				const notifs: number = window.KA._userProfileData.countBrandNewNotifications;
				greenCircle.textContent = notifs.toString();
			}
		}).catch(console.error);
}

export { deleteNotifButtons, updateNotifIndicator };
