import * as updateLog from "../resources/update-log.json";
import { getChromeCookies, getChromeFkey } from "./util/cookie-util";
import { formatDate, escapeHTML, KAMarkdowntoHTML } from "./util/text-util";
import { CSRF_HEADER, COOKIE } from "./types/names";
import { Notification, NotifObj } from "./types/data";

interface LogEntry {
	version: string;
	new: string[];
	fixes: string[];
}

let currentPage: number = 0;
let currentCursor: string = "";

const log: LogEntry[] = <LogEntry[]>Object.assign([], updateLog);

const version: HTMLElement | null = document.getElementById("version");
const newFeatures: HTMLElement | null = document.getElementById("new");
const fixes: HTMLElement | null = document.getElementById("fixes");

const navButtons: NodeListOf<HTMLElement> | null = document.querySelectorAll(".nav.button");
const pages: NodeListOf<HTMLElement> | null = document.querySelectorAll(".page");

const generalNav: HTMLElement | null = document.getElementById("general");
const notifsNav: HTMLElement | null = document.getElementById("notifs");

const unreadNumber: HTMLElement | null = document.querySelector(".unread-number");
const notifsContainer: HTMLElement | null = document.querySelector(".notifs-container");
const loadingSpinner: HTMLElement | null = document.querySelector(".loading-spinner");
const markRead: HTMLElement | null = document.querySelector(".mark-notifications-read");
const loadMore: HTMLElement | null = document.querySelector(".notifications-button-more");

function elementWithHTML (tag: string, text: string): HTMLElement {
	const element: HTMLElement = document.createElement(tag);
	element.innerHTML = text;
	return element;
}

function createOption (text: string, value: number): HTMLElement {
	const option: HTMLOptionElement = document.createElement("option");
	option.value = value.toString();
	option.textContent = text;
	return option;
}

function versionPage (i: number): void {
	newFeatures!.innerHTML = fixes!.innerHTML = "";
	log[i].new.map(e => elementWithHTML("li", e)).forEach(e => newFeatures!.appendChild(e));
	log[i].fixes.map(e => elementWithHTML("li", e)).forEach(e => fixes!.appendChild(e));
}

function page (i: number): void {
	for (let p = 0; p < pages!.length; p++) {
		pages![p].setAttribute("style", "display: none");
	}
	pages![i % 2].setAttribute("style", "display: block");
	for (let b = 0; b < navButtons!.length; b++) {
		navButtons![b].setAttribute("style", "border-bottom: 1px solid rgb(206, 211, 215); background: rgb(250, 250, 250);");
	}
	navButtons![i % 2].setAttribute("style", "border-bottom: none; background: none;");
}

function isModMessage (notif: Notification): boolean {
	return notif.class_.includes("ModNotification");
}

function getImageSrc (notif: Notification): string {
	if (isModMessage(notif)) {
		return "../images/guardian.png";
	}
	return notif.iconSrc || notif.authorAvatarSrc || notif.topicIconUrl || notif.imageSource || "../images/hand.png";
}

function getContent (notif: Notification): string {
	if (notif.content) {
		return KAMarkdowntoHTML(escapeHTML(notif.content));
	} else if (notif.text) {
		return escapeHTML(notif.text);
	} else {
		console.error(`Possible Unhandled notif type: ${JSON.stringify(notif, null, 4)}`);
		return "";
	}
}

function getAuthorNote (notif: Notification): string {
	if (notif.modNickname) {
		/* Moderator Message */
		return `<b>${escapeHTML(notif.modNickname)}</b> send you a guardian message:`;
	} else if (notif.authorNickname) {
		/* New Comment or Reply */
		return `<b>${escapeHTML(notif.authorNickname)}</b> added a comment on <b>${escapeHTML(notif.translatedFocusTitle || notif.translatedScratchpadTitle || "")}</b>`;
	} else if (notif.coachName && notif.contentTitle) {
		/* Coach Assignment */
		return `<b>${escapeHTML(notif.coachName)}</b> assigned you <b>${escapeHTML(notif.contentTitle)}</b>`;
	} else if (notif.missionName && notif.class_.includes("ClassMissionNotification")) {
		/* New Mission */
		return `New Mission: <b>${escapeHTML(notif.missionName)}</b>`;
	} else if (notif.translatedDisplayName && notif.class_.includes("RewardNotification")) {
		/* New Reward (?) */
		return `New Reward: <b>${escapeHTML(notif.translatedDisplayName)}</b>`;
	} else if (notif.iconSrc && notif.extendedDescription && notif.description) {
		/* New Badge */
		return `New Badge: <b>${escapeHTML(notif.description)}</b>`;
	}

	return "";
}

interface NotifElm {
	href: string;
	imgSrc: string;
	content: string;
	date: string;
	authorNote: string;
}

function genNotif (notif: NotifElm): string {
	return notif.authorNote && `
		<div class="new-notif">
			<a target="_blank" href="${notif.href}">
				<div class="notif-wrap">
					<img class="notif-img" src="${notif.imgSrc}">
					<p class="author-note">${notif.authorNote}</p>
					${notif.content && `<p class="notif-content">${notif.content}</p>`}
					<div class="notif-date">${notif.date}</div>
				</div>
			</a>
		<div>
	`;
}

function newNotif (notif: Notification): string {
	const notifToReturn: NotifElm = {
		href: `https://www.khanacademy.org/notifications/read?keys=${notif.urlsafeKey}&redirct_url=${notif.url || "/"}`,
		imgSrc: getImageSrc(notif),
		content: getContent(notif),
		date: formatDate(notif.date),
		authorNote: getAuthorNote(notif)
	};
	return genNotif(notifToReturn);
}

function fkeyNotFound () {
	notifsContainer!.innerHTML =
		"<h2 class=\"please-sign-in\">Please visit KA and make sure you're signed in</h2>";
}

function displayNotifs (notifJson: NotifObj) {
	if (!notifJson) { console.log("Didn't receieve notifications."); }
	currentCursor = notifJson.cursor;
	// Add unread count here, with KA object.
	unreadNumber!.textContent = "";

	loadingSpinner!.style.display = "none";
	notifJson.notifications.forEach((notif: Notification) => {
		if (notif.notes) {
			notif.notes.forEach((note: Notification) => {
				notifsContainer!.innerHTML += newNotif(note);
			});
		} else {
			notifsContainer!.innerHTML += newNotif(notif);
		}
	});
	loadMore!.style.display = "block";
}

function getNotifs () {
	loadMore!.setAttribute("disabled", "true");
	getChromeFkey().then(fkey => {
		fetch(`https://www.khanacademy.org/api/internal/user/notifications/readable?cursor=${currentCursor}&casing=camel`, {
			method: "GET",
			headers: {
				[CSRF_HEADER]: fkey.toString(),
				[COOKIE]: getChromeCookies()
			},
			credentials: "same-origin"
		}).then((res: Response): (Promise<NotifObj> | NotifObj) => {
			return res.json();
		}).then((data: NotifObj): void => {
			loadMore!.removeAttribute("disabled");
			displayNotifs(data);
		}).catch(e => {
			console.error(e);
			loadMore!.removeAttribute("disabled");
		});
	}).catch(fkeyNotFound);
}

function markNotifsRead () {
	getChromeFkey().then(fkey => {
		fetch(`https://www.khanacademy.org/api/internal/user/notifications/clear_brand_new`, {
			method: "POST",
			headers: {
				[CSRF_HEADER]: fkey.toString(),
				[COOKIE]: getChromeCookies()
			},
			credentials: "same-origin"
		}).then((res: Response): (Promise<NotifObj> | NotifObj) => {
			return res.json();
		}).catch(console.error);
	}).catch(fkeyNotFound);
}

generalNav!.addEventListener("click", e => currentPage > 0 && page(--currentPage));
notifsNav!.addEventListener("click", e => {
	if (currentPage > log.length - 1) { return; }
	page(++currentPage);
	if (document.getElementsByClassName("new-notif").length < 1) {
		getNotifs();
	}
});
loadMore!.addEventListener("click", e => {
	getNotifs();
});
markRead!.addEventListener("click", e => {
	markNotifsRead();
});

log.forEach((e, i) => version!.appendChild(createOption(e.version, i)));
version!.onchange = function (e): void {
	versionPage(+(<HTMLInputElement> e.target).value);
};

versionPage(0);
page(0);
