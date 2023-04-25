import updateLog from "../resources/update-log.json";
import { getChromeCookies, getChromeFkey } from "./util/cookie-util";
import { formatDate, escapeHTML, KAMarkdowntoHTML, relativeDate } from "./util/text-util";
import { CSRF_HEADER, COOKIE, API_ORIGIN } from "./types/names";
import { Notification, NotifElm, BadgeNotif } from "./types/data";
import { getUserNotifications } from "./util/graphql-util";

interface LogEntry {
	version: string;
	new: string[];
	fixes: string[];
}

enum Page {
	UpdateLog = 0,
	Notif = 1,
}

let currentPage: Page = Page.Notif;

const log: LogEntry[] = <LogEntry[]>Object.assign([], updateLog);

const version: HTMLElement = document.getElementById("version")!;
const newFeatures: HTMLElement = document.getElementById("new")!;
const fixes: HTMLElement = document.getElementById("fixes")!;

const navButtons: NodeListOf<HTMLElement> = document.querySelectorAll(".nav.button")!;
const pages: NodeListOf<HTMLElement> = document.querySelectorAll(".page")!;

const generalNav: HTMLElement | null = document.getElementById("general");
const notifsNav: HTMLElement | null = document.getElementById("notifs");

const unreadNumber: HTMLElement | null = document.querySelector(".unread-number");
const notifsContainer: HTMLElement | null = document.querySelector(".notifs-container");
const loadingSpinner: HTMLElement | null = document.querySelector(".loading-spinner");
const markRead: HTMLElement | null = document.querySelector(".mark-notifications-read");

const notifsPage: HTMLElement | null = document.querySelector(".notifications");

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

function goToPage (page: Page): void {
	const pageIndex = page as number;
	for (const p of pages) {
		p.style.display = "none";
	}
	pages[pageIndex].style.display = "block";
	for (const b of navButtons) {
		b.style.borderBottom = "1px solid rgb(206, 211, 215)";
		b.style.background = "rgb(250, 250, 250)";
	}
	navButtons[pageIndex].style.borderBottom = "none";
	navButtons[pageIndex].style.background = "none";
}

function isModMessage (notif: Notification): boolean {
	return notif.class_.includes("ModNotification");
}

function getImageSrc (notif: Notification): string {
	// Badge notification group
	if (notif.badgeNotifications && notif.badgeNotifications.length > 0) {
		return notif.badgeNotifications[notif.badgeNotifications.length - 1].badge.icons.compactUrl;
	}

	// Single badge
	if (notif.badge) {
		return notif.badge.icons.compactUrl;
	}

	// Guardian message
	if (isModMessage(notif)) {
		return "../images/guardian.png";
	}

	return notif.authorAvatarSrc || notif.authorAvatarUrl || notif.classroom?.topics?.iconUrl || notif.curationNodeIconURL || notif.thumbnailSrc || "../images/hand.png";
}

function formatBadgeBatch (badges: { badge: BadgeNotif }[]): string {
	const descriptions = badges.map(badge => `<b>${escapeHTML(badge.badge.description)}</b>`);

	const count = descriptions.length;
	if (count > 1) {
		descriptions[count - 1] = "and " + descriptions[count - 1];
	}

	return descriptions.join(", ");
}

function getContent (notif: Notification): string {
	if (isModMessage(notif)) {
		return KAMarkdowntoHTML(escapeHTML(notif.text || ""));
	} else if (notif.content) {
		return KAMarkdowntoHTML(escapeHTML(notif.content));
	} else if (notif.className && notif.contentTitle) {
		return `<b>${escapeHTML(notif.contentTitle)}</b>`;
	} else if (notif.text) {
		return escapeHTML(notif.text);
	} else if (notif.badge?.fullDescription) {
		return escapeHTML(notif.badge?.fullDescription);
	} else if (notif.badgeNotifications && notif.badgeNotifications.length > 0) {
		return formatBadgeBatch(notif.badgeNotifications);
	} else {
		console.error(`Possible Unhandled notif type: ${JSON.stringify(notif, null, 4)}`);
		return "";
	}
}

function getAuthorNote (notif: Notification): string {
	if (isModMessage(notif)) {
		/* Moderator Message */
		return `<b>You recieved a guardian message</b>:`;
	} else if (notif.authorNickname) {
		/* New Comment or Reply */
		return `<b>${escapeHTML(notif.authorNickname)}</b> added a comment on <b>${escapeHTML(notif.focusTranslatedTitle || notif.translatedScratchpadTitle || "")}</b>`;
	} else if (notif.className && notif.contentTitle) {
		/* Coach Assignment */
		return `New Assignment:`;
	} else if (notif.badgeNotifications) {
		return `You earned ${notif.badgeNotifications.length} new badges:`;
	} else if (notif.badge) {
		/* New Badge */
		return `New Badge: <b>${escapeHTML(notif.badge.description)}</b>`;
	}

	return "";
}

function genNotif (notif: NotifElm): string {
	return notif.authorNote && `
		<div class="new-notif">
			<a target="_blank" href="${notif.href}">
				<div class="notif-wrap">
					<img class="notif-img" src="${notif.imgSrc}">
					<p class="author-note">${notif.authorNote}</p>
					${notif.content && `<p class="notif-content">${notif.content}</p>`}
					<div class="notif-date" title="${formatDate(notif.date)}">${relativeDate(notif.date)}</div>
				</div>
			</a>
			${(() => {
				// if (!notif.isComment) { return ""; }
				return `
					<div class="reply" programID="${notif.programID}" feedback="${notif.feedback}">
						<a class="reply-button">Reply</a>
						<textarea class="reply-text hide"></textarea>
					</div>`;
			})()}
		<div>`;
}

function newNotif (notif: Notification): string {
	const notifToReturn: NotifElm = {
		href: (() => {
			if (isModMessage(notif)) {
				return "javascript:void(0)";
			}
			if (notif.class_.includes("AvatarPartNotification")) {
				return `https://www.khanacademy.org/profile/${notif.kaid}?show_avatar_customizer=1&selected_avatar_part=${notif.name}`;
			}
			return "https://www.khanacademy.org" + notif.url;
		})(),
		imgSrc: getImageSrc(notif),
		content: getContent(notif),
		date: formatDate(notif.date),
		authorNote: getAuthorNote(notif),
		// isComment: notif.feedbackIsComment || notif.feedbackIsReply || false,
		programID: (() => {
			if (!notif.url) { return ""; }
			const matches = notif.url.match(/(\d{10,16})/);
			return matches ? matches[0] : "";
		})(),
		feedback: ""
	};
	return genNotif(notifToReturn);
}

function addReplyListeners (): void {
	const comments = document.getElementsByClassName("reply") as HTMLCollectionOf<HTMLDivElement>;
	debugger;
	Array.from(comments).forEach(replyDiv => {
		const replyButton = replyDiv.firstElementChild as HTMLAnchorElement;

		replyButton.addEventListener("click", () => {

			const buttonState = replyButton.textContent,
				content = (replyDiv.lastElementChild as HTMLTextAreaElement).value,
				notifProgram = replyDiv.getAttribute("programID"),
				feedbackKey = replyDiv.getAttribute("feedback");

			(replyDiv.lastElementChild as HTMLTextAreaElement).classList.toggle("hide");
			if (buttonState !== "Send") {
				return replyButton.textContent = "Send";
			}
			if (content.length < 1) {
				return replyButton.textContent = "Reply";
			}
			replyButton.textContent = "Sending...";

			// TODO: This endpoint no longer exists
			/* fetch(`${API_ORIGIN}/discussions/scratchpad/${notifProgram}/comment?qa_expand_key=${feedbackKey}`)
				.then(resp => resp.json())
				.then(resp => resp as Feedback)
				.then(resp => {
					if (resp.feedback.length < 1) { return; }
					const parentComment = resp.feedback[0],
						parentFocus = resp.focus;

					getChromeFkey().then(fkey => {
						fetch(`${API_ORIGIN}/discussions/${parentComment.key}/replies`, {
							method: "POST",
							headers: {
								[CSRF_HEADER]: fkey.toString(),
								[COOKIE]: getChromeCookies(),
								"content-type": "application/json"
							},
							body: JSON.stringify({
								text: content,
								topicSlug: parentFocus.topicUrl.replace("/", ""),
							}),
							credentials: "same-origin"
						}).then(resp => {

							if (resp.status !== 200) { return; }
							replyButton.textContent = "Sent!";
							setTimeout(() => {
								replyButton.textContent = "Reply";
							}, 1000);

						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);*/
		});
	});
}

function fkeyNotFound () {
	notifsContainer!.innerHTML =
		"<h2 class=\"please-sign-in\">Please visit KA and make sure you're signed in</h2>";
}

function displayNotifs (notifications: Notification[]) {
	debugger;
	if (!notifications) { console.error("Didn't receieve notifications."); }
	// currentCursor = notifJson.cursor;
	// Add unread count here, with KA object.
	// unreadNumber!.textContent = "";

	loadingSpinner!.style.display = "none";
	for (const notif of notifications) {
		notifsContainer!.innerHTML += newNotif(notif);
		/*if (notif.notes) {
			notif.notes.forEach((note: Notification) => {
				notifsContainer!.innerHTML += newNotif(note);
			});
		} else {
			notifsContainer!.innerHTML += newNotif(notif);
		}*/
	}
}

let notificationGenerator: AsyncGenerator<Notification[], number, void>;
// Get the next page of notifs, and then call displayNotifs with them
function getNotifs () {
	if (!notificationGenerator) {
		notificationGenerator = getUserNotifications();
	}
	notificationGenerator.next().then(function ({ value: data, done }) {
		if (typeof data === "object") {
			displayNotifs(data);
			addReplyListeners();
		}
	});
}

/*function getNotifs () {
	getChromeFkey().then(fkey => {
		debugger;
		// This endpoint is broken, and KA has moved to a graphQL version, so I don't think they'll fix it.


		fetch(`https://www.khanacademy.org/api/internal/user/notifications/readable?cursor=${currentCursor}&casing=camel`, {
			method: "GET",
			headers: {
				[CSRF_HEADER]: fkey.toString(),
				[COOKIE]: getChromeCookies()
			},
			credentials: "same-origin"
		}).then((res: Response): Promise<NotifObj> => {
			return res.json();
		}).then((data: NotifObj): void => {
			displayNotifs(data);
			addReplyListeners();
		}).catch(e => {
			console.error(e);
		});
	}).catch(fkeyNotFound);
}*/


function markNotifsRead () {
	// TODO: Did this move to graphQL?
	// Why is it returning a NotifObj?
	getChromeFkey().then(fkey => {
		fetch(`https://www.khanacademy.org/api/internal/user/notifications/clear_brand_new`, {
			method: "POST",
			headers: {
				[CSRF_HEADER]: fkey.toString(),
				[COOKIE]: getChromeCookies()
			},
			credentials: "same-origin"
		}).then(res => {
			return res.json();
		}).catch(console.error);
	}).catch(fkeyNotFound);
}

generalNav!.addEventListener("click", e => {
	currentPage = Page.UpdateLog;
	goToPage(currentPage);
});

notifsNav!.addEventListener("click", e => {
	currentPage = Page.Notif;
	goToPage(currentPage);
	if (document.getElementsByClassName("new-notif").length < 1) {
		getNotifs();
	}
});

if (notifsPage) {
	notifsPage.addEventListener("scroll", () => {
		if (currentPage === Page.Notif && Math.abs(notifsPage.scrollHeight - notifsPage.offsetHeight - notifsPage.scrollTop) < 1) {
			getNotifs();
		}
	});
}

markRead!.addEventListener("click", e => {
	markNotifsRead();
});

log.forEach((e, i) => version!.appendChild(createOption(e.version, i)));
version!.onchange = function (e): void {
	versionPage(+(<HTMLInputElement>e.target).value);
};

versionPage(0);
goToPage(Page.Notif);
getNotifs();
