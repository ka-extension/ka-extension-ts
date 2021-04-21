import updateLog from "../resources/update-log.json";
import { getChromeCookies, getChromeFkey } from "./util/cookie-util";
import { formatDate, escapeHTML, KAMarkdowntoHTML } from "./util/text-util";
import { CSRF_HEADER, COOKIE, API_ORIGIN } from "./types/names";
import { Notification, NotifObj, Feedback, NotifElm } from "./types/data";

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
	return notif.iconSrc || notif.authorAvatarSrc || notif.topicIconUrl || notif.imageSource || notif.thumbnailSrc || "../images/hand.png";
}

function getContent (notif: Notification): string {
	if (notif.content) {
		return KAMarkdowntoHTML(escapeHTML(notif.content));
	} else if (notif.text) {
		return escapeHTML(notif.text);
	} else if (notif.extendedDescription) {
		return escapeHTML(notif.extendedDescription);
	} else if (notif.translatedRequirements) {
		return escapeHTML(notif.translatedRequirements[0]);
	} else {
		console.error(`Possible Unhandled notif type: ${JSON.stringify(notif, null, 4)}`);
		return "";
	}
}

function getAuthorNote (notif: Notification): Node {
	const noteTag = document.createElement("p");
	noteTag.className = "author-note";
	const authorTag = document.createElement("b");
	const titleTag = document.createElement("b");

	if (notif.modNickname) {
		/* Moderator Message */
		authorTag.textContent = notif.modNickname;
		noteTag.appendChild(authorTag);
		noteTag.textContent = noteTag.textContent + " sent you a guardian message:";
	} else if (notif.authorNickname) {
		/* New Comment or Reply */
		authorTag.textContent = notif.authorNickname;
		noteTag.appendChild(authorTag);
		noteTag.textContent = noteTag.textContent + " added a comment on ";
		titleTag.textContent = notif.translatedFocusTitle || notif.translatedScratchpadTitle || "";
		noteTag.appendChild(titleTag);
	} else if (notif.coachName && notif.contentTitle) {
		/* Coach Assignment */
		authorTag.textContent = notif.coachName;
		noteTag.appendChild(authorTag);
		noteTag.textContent = noteTag.textContent + " assigned you ";
		titleTag.textContent = notif.contentTitle;
		noteTag.appendChild(titleTag);
	} else if (notif.missionName && notif.class_.includes("ClassMissionNotification")) {
		/* New Mission */
		noteTag.textContent = "New Mission: ";
		authorTag.textContent = notif.missionName;
		noteTag.appendChild(authorTag);
	} else if (notif.translatedDisplayName && notif.class_.includes("RewardNotification")) {
		/* New Reward (?) */
		noteTag.textContent = "New Reward: ";
		authorTag.textContent = notif.translatedDisplayName;
		noteTag.appendChild(authorTag);
	} else if (notif.iconSrc && notif.extendedDescription && notif.description) {
		/* New Badge */
		noteTag.textContent = "New Badge: ";
		authorTag.textContent = notif.description;
		noteTag.appendChild(authorTag);
	}

	return noteTag;
}

function genNotif (notif: NotifElm): Node {
	const container = document.createElement("div");
	container.className = "new-notif";

	const linkTag = document.createElement("a");
	linkTag.target = "_blank";
	linkTag.href = notif.href;

	const wrapTag = document.createElement("div");
	wrapTag.className = "notif-wrap";

	const imgTag = document.createElement("img");
	imgTag.className = "notif-img";
	imgTag.src = notif.imgSrc;

	const contentTag = document.createElement("p");
	contentTag.className = "notif-content";
	contentTag.textContent = notif.content;

	const dateTag = document.createElement("div");
	dateTag.className = "notif-date";
	dateTag.textContent = notif.date;

	wrapTag.appendChild(imgTag);
	wrapTag.appendChild(notif.authorNote);
	wrapTag.appendChild(contentTag);
	wrapTag.appendChild(dateTag);
	linkTag.appendChild(wrapTag);
	container.appendChild(linkTag);

	const replyTag = document.createElement("div");
	replyTag.className = "reply";
	replyTag.setAttribute("programID", notif.programID);
	replyTag.setAttribute("feedback", notif.feedback);

	const replyButtonTag = document.createElement("a");
	replyButtonTag.className = "reply-button";
	replyButtonTag.textContent = "Reply";

	const replyTextTag = document.createElement("textarea");
	replyTextTag.className = "reply-text hide";

	if (notif.isComment) {
		replyTag.appendChild(replyButtonTag);
		replyTag.appendChild(replyTextTag);
		container.appendChild(replyTag);
	}

	return container;
}

function newNotif (notif: Notification): Node {
	const notifToReturn: NotifElm = {
		href: (() => {
			if (notif.class_.includes("AvatarPartNotification")) {
				return `https://www.khanacademy.org/profile/${notif.kaid}?show_avatar_customizer=1&selected_avatar_part=${notif.name}`;
			} else {
				return `https://www.khanacademy.org/notifications/read?keys=${notif.urlsafeKey}&redirect_url=${notif.url || "/"}`;
			}
		})(),
		imgSrc: getImageSrc(notif),
		content: getContent(notif),
		date: formatDate(notif.date),
		authorNote: getAuthorNote(notif),
		isComment: notif.feedbackIsComment || notif.feedbackIsReply || false,
		programID: (() => {
			if (!notif.url) { return ""; }
			const matches = notif.url.match(/(\d{10,16})/);
			return matches ? matches[0] : "";
		})(),
		feedback: notif.feedback || ""
	};
	return genNotif(notifToReturn);
}

function addReplyListeners (): void {
	const comments = document.getElementsByClassName("reply") as HTMLCollectionOf<HTMLDivElement>;
	Array.from(comments).forEach(replyDiv => {
		const replyButton = replyDiv.firstElementChild as HTMLAnchorElement;

		replyButton.addEventListener("click", () => {

			const buttonState = replyButton.textContent,
				content = (replyDiv.lastElementChild as HTMLTextAreaElement).value,
				notifProgram = replyDiv.getAttribute("programID"),
				feedbackKey = replyDiv.getAttribute("feedback");

			(replyDiv.lastElementChild as HTMLTextAreaElement).classList.toggle("hide");
			if (buttonState !== "Send") { return replyButton.textContent = "Send"; }
			if (content.length < 1) { return replyButton.textContent = "Reply"; }
			replyButton.textContent = "Sending...";

			fetch(`${API_ORIGIN}/discussions/scratchpad/${notifProgram}/comment?qa_expand_key=${feedbackKey}`)
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
				}).catch(console.error);
		});
	});
}

function fkeyNotFound () {
	notifsContainer!.innerHTML = "";
	const infoTag = document.createElement("h2");
	infoTag.className = "please-sign-in";
	infoTag.textContent = "Please visit KA and make sure you're signed in";
	notifsContainer!.appendChild(infoTag);
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
				notifsContainer!.appendChild(newNotif(note));
			});
		} else {
			notifsContainer!.appendChild(newNotif(notif));
		}
	});
}

function getNotifs () {
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
			displayNotifs(data);
			addReplyListeners();
		}).catch(e => {
			console.error(e);
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

if (notifsPage) {
	notifsPage.addEventListener("scroll", () => {
		if (currentPage > 0 && notifsPage.scrollTop === (notifsPage.scrollHeight - notifsPage.offsetHeight)) {
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
page(1);
getNotifs();
