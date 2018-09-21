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

function isKAEvalPlead (notif: Notification): boolean {
	return notif.class_.indexOf("PleaseEvalCsNotification") !== -1;
}

function isKAEvalReplyPlead (notif: Notification): boolean {
	return notif.class_.indexOf("EvalEachotherNotification") !== -1;
}

function isModMessage (notif: Notification): boolean {
	return notif.class_.indexOf("ModNotification") !== -1;
}

function newNotif (notif: Notification): string {
	// Depending on notification type, "<span> added a comment on </span>" will vary.
	// See if notifs can have "mark read" button, and somehow mark them read individually.
	// Unread notifs could have that green dot or have a slightly different style somehow.
	return notif.notes && notif.notes.length > 0 ? notif.notes.map(newNotif).join("\n") :
		`<a target="_blank" href="https://www.khanacademy.org/notifications/read?keys=${notif.urlsafeKey}&redirect_url=${notif.url || "/"}">
			<div class="new-notif">
				<img class="notif-img" src="${isModMessage(notif) && "../images/guardian.png" || (isKAEvalPlead(notif) ||
					isKAEvalReplyPlead(notif)) && "../images/hand.png" || notif.iconSrc || notif.authorAvatarSrc ||
					notif.topicIconUrl || notif.imageSource || "../images/blank.png"}">
				<p class="notif-content">
					${(() => {
						if (isKAEvalPlead(notif)) {
							return "<strong>Help one of your fellow students learn, evaluate a project today! → →</strong>";
						} else if (isKAEvalReplyPlead(notif)) {
							return "<strong>Now that your project has been evaluated, return the favor. Evaluate a peer today! → →</strong>";
						} else if (notif.modNickname && notif.text) {
							return `
								<span><strong>${escapeHTML(notif.modNickname)}</strong> sent you a guardian message:</span><br />
								<span>${KAMarkdowntoHTML(escapeHTML(notif.text) || "")}</span>`;
						} else if (notif.authorNickname && (notif.translatedFocusTitle || notif.translatedScratchpadTitle) && notif.content) {
							// 'added a comment on' should depend on notif type.
							return `
								<strong>${escapeHTML(notif.authorNickname)}</strong>
								<span> added a comment on </span>
								<strong>${escapeHTML(notif.translatedFocusTitle || notif.translatedScratchpadTitle || "")}</strong>:<br />
								<span>${KAMarkdowntoHTML(escapeHTML(notif.content) || "")}</span>`;
						} else if (notif.coachName && notif.contentTitle) {
							return `
								<strong>${escapeHTML(notif.coachName)}</strong> assigned you <strong>${escapeHTML(notif.contentTitle)}</strong>`;
						} else if (notif.missionName && notif.class_.indexOf("ClassMissionNotification") !== -1) {
							return `<strong>New Mission: ${escapeHTML(notif.missionName)}</strong>`;
						} else if (notif.translatedDisplayName && notif.class_.indexOf("RewardNotification") !== -1) {
							return `<strong>Reward Acquired: ${escapeHTML(notif.translatedDisplayName)}</strong>`;
						} else if (notif.iconSrc && notif.extendedDescription && notif.description) {
							return `
								<strong>New Badge</strong>:<br />
								<span>${escapeHTML(notif.description)}</span>`;
						} else if (notif.text) {
							console.info("INFO: Non-specific notif", notif);
							return `<span>${escapeHTML(notif.text)}</span>`;
						} else {
							console.error(`ERROR: Unhandled notif type: ${JSON.stringify(notif, null, 4)}`);
							return `<strong>Error processing notif.  Check console for details.</strong>`;
						}
					})()}
				</p>
				<div class="notif-date">${formatDate(notif.date)}</div>
			</div>
		</a>`;
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
		notifsContainer!.innerHTML += newNotif(notif);
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
	getNotifs();
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
