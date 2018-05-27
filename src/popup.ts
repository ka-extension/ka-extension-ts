import * as updateLog from "../resources/update-log.json";
import { getCookies, getChromeCookies, getCSRF, getChromeFkey } from "./util/cookie-util";
import { getJSON } from "./util/api-util";
import { formatDate } from "./util/text-util";
import { CSRF_HEADER, COOKIE } from "./names";
import { Notification } from "./data";

interface LogEntry {
    version: string;
    new: string[];
    fixes: string[];
};

interface NotifObj {
    cursor: string;
    notifications: Notification[];
    has_more: boolean;
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

function elementWithText(tag: string, text: string): HTMLElement {
    const element: HTMLElement = document.createElement(tag);
    element.textContent = text;
    return element;
};

function createOption(text: string, value: number): HTMLElement {
    const option: HTMLOptionElement = document.createElement('option');
    option.value = value.toString();
    option.textContent = text;
    return option;
}

function versionPage(i: number): void {
    newFeatures!.innerHTML = fixes!.innerHTML = "";
    log[i].new.map(e => elementWithText("li", e)).forEach(e => newFeatures!.appendChild(e));
    log[i].fixes.map(e => elementWithText("li", e)).forEach(e => fixes!.appendChild(e));
};

function page(i: number): void {
    for (var p = 0; p < pages!.length; p++) {
        pages![p].setAttribute("style", "display: none");
    }
    pages![i].setAttribute("style", "display: block");
    for (var b = 0; b < navButtons!.length; b++) {
        navButtons![b].setAttribute("style", "border-bottom: 1px solid rgb(206, 211, 215); background: rgb(250, 250, 250);");
    }
    navButtons![i].setAttribute("style", "border-bottom: none; background: none;");
};

function displayNotifs(notifJson: NotifObj) {
    if (!notifJson) console.log("Didn't receieve notifications.");
    currentCursor = notifJson.cursor;
    // Add unread count here, with KA object.
    unreadNumber!.textContent = "";
    function newNotif(notif: Notification): string {
        // Depending on notification type, "<span> added a comment on </span>" will vary.
        // See if notifs can have "mark read" button, and somehow mark them read individually.
        // Unread notifs could have that green dot or have a slightly different style somehow.
        let nickText = document.createTextNode(notif.author_nickname);
        let focusText = document.createTextNode(notif.translated_focus_title);
        let contentText = document.createTextNode(notif.content);

        return `<a target="_blank" href="https://www.khanacademy.org${notif.url}">
                    <div class="new-notif">
                        <img class="notif-img" src="${notif.author_avatar_src}">
                        <p class="notif-content">
                            <strong>${nickText.textContent}</strong>
                            <span> added a comment on </span>
                            <strong>${focusText.textContent}</strong>:<br>
                            <span>${contentText.textContent}</span>
                        </p>
                        <div class="notif-date">${formatDate(notif.date)}</div>
                    </div>
                </a>`;
    }
    loadingSpinner!.style.display = "none";
    notifJson.notifications.forEach((notif: Notification) => {
        notifsContainer!.innerHTML += newNotif(notif);
    });
    loadMore!.style.display = "block";
};

function getNotifs() {
    getChromeFkey().then((fkey) => {
        fetch(`https://www.khanacademy.org/api/internal/user/notifications/readable?cursor=${currentCursor}`, {
            method: 'GET',
            headers: {
                [CSRF_HEADER]: fkey.toString(),
                [COOKIE]: getChromeCookies()
            },
            credentials: "same-origin"
        }).then((res: Response): (Promise<NotifObj> | NotifObj) => {
            return res.json();
        }).then((data: NotifObj): void => {
            displayNotifs(data);
        });
    });
};

function markNotifsRead() {
    getChromeFkey().then((fkey) => {
        fetch(`https://www.khanacademy.org/api/internal/user/notifications/clear_brand_new`, {
            method: 'POST',
            headers: {
                [CSRF_HEADER]: fkey.toString(),
                [COOKIE]: getChromeCookies()
            },
            credentials: "same-origin"
        }).then((res: Response): (Promise<NotifObj> | NotifObj) => {
            return res.json();
        }).then((data: NotifObj): void => {
            console.log(data);
        });
    });
}

generalNav!.addEventListener("click", e => currentPage > 0 && page(--currentPage));
notifsNav!.addEventListener("click", e => {
    if (currentPage > log.length - 1) return;
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
version!.onchange = function(e): void {
    versionPage(+(<HTMLInputElement> e.target).value);
};

versionPage(0);
page(0);
