import { buildQuery } from "./util/text-util";
import { Program, UsernameOrKaid } from "./types/data";
import { QUEUE_ROOT, EXTENSION_ITEM_CLASSNAME, EXTENSION_ID } from "./types/names";
import { DiscussionTypes, getConvo } from "./util/api-util";
import { Message, MessageTypes, Downloadable } from "./types/message-types";
import { querySelectorAllPromise } from "./util/promise-util";
import { getJSON } from "./util/api-util";
import { UserProfileData, IdType } from "./types/data";

function addReportButton (program: Program, kaid: string) {
	const buttons: HTMLElement | null = document.querySelector(".buttons_vponqv");
	if (buttons && kaid !== program.kaid) {
		const reportButton: HTMLAnchorElement = document.createElement("a");
		reportButton.id = "kae-report-button";
		reportButton.href = `${QUEUE_ROOT}submit?${buildQuery({
			type: "program",
			id: program.id.toString(),
			callback: window.location.href
		})}`;
		reportButton.setAttribute("role", "button");
		reportButton.innerHTML = "<span>Report</span>";
		buttons.insertBefore(reportButton, buttons.children[1]);
	}
}

async function addProfileReportButton (uok: UsernameOrKaid, loggedInKaid: string) {
	const kaid: string = uok.type === IdType.KAID ? uok.toString() :
		await getJSON(`${window.location.origin}/api/internal/user/profile?username=${uok}`, {
			kaid: 1
		}).then(data => data as UserProfileData).then(e => e.kaid);
	if (loggedInKaid === kaid) { return; }
	const widget: NodeList = await querySelectorAllPromise(".profile-widget", 100);
	const [discussionWidget] = Array.prototype.slice.call(widget)
		.filter((e: HTMLElement) => e.querySelector("a.profile-widget-view-all[href$=\"/discussion\"]"));
	if (discussionWidget) {
		const button: HTMLAnchorElement = document.createElement("a");
		button.id = "kae-report-button";
		button.style.setProperty("margin", "10px 0px 10px 0px", "important");
		button.style.setProperty("display", "block", "important");
		button.innerHTML = "<span>Report user</span>";
		button.href = `${QUEUE_ROOT}submit?${buildQuery({
			type: "user",
			id: kaid,
			callback: window.location.href
		})}`;
		const dWidget = document.getElementById("discussion-widget");
		const widget = discussionWidget.getElementsByClassName("profile-widget-contents")[0];
		dWidget && dWidget.children[0] ? dWidget.insertBefore(button, dWidget.children[0]) : widget.appendChild(button);
	}
}

function addReportButtonDiscussionPosts (focusId: string, focusKind: string) {
	const items: NodeListOf<HTMLDivElement> = document.querySelectorAll(
		`.question:not(.${EXTENSION_ITEM_CLASSNAME}), ` +
		`.comment:not(.${EXTENSION_ITEM_CLASSNAME})`);
	for(let i = 0; i < items.length; i++) {
		const item: HTMLDivElement = items[i];
		const id: string = item.id;
		if(id.length > 0) {
			const meta: HTMLDivElement | null = item.getElementsByClassName("discussion-meta-controls")
				[0] as HTMLDivElement;
			if(meta) {
				const separator: HTMLSpanElement = document.createElement("span");
				separator.className = "discussion-meta-separator";
				separator.textContent = "•";
				const report: HTMLAnchorElement = document.createElement("a");
				report.href = `${QUEUE_ROOT}submit?${buildQuery({
					type: "discussion",
					id: `${item.classList.contains("comment") ?
						"comment" : "question"}|${focusKind}|${focusId}|${id}`,
					callback: window.location.href
				})}`;
				report.textContent = "Report";
				meta.appendChild(separator);
				meta.appendChild(report);

				if(item.classList.contains("comment") && typeof Blob !== "undefined" && typeof URL !== "undefined") {
					meta.appendChild(separator.cloneNode(true));
					const download: HTMLAnchorElement = document.createElement("a");
					download.href = "#";
					download.setAttribute("data-key", id);
					download.setAttribute("data-focus-id", focusId);
					download.setAttribute("data-focus-kind", focusKind);
					download.textContent = "Download conversation";
					download.addEventListener("click", (e: MouseEvent) => {
						e.preventDefault();
						const target: HTMLAnchorElement = e.target as HTMLAnchorElement;
						const key: string | null = target.getAttribute("data-key"),
							focusId: string | null = target.getAttribute("data-focus-id"),
							focusKind: string | null = target.getAttribute("data-focus-kind");
						if(key && focusId && focusKind) {
							getConvo(key, focusKind, focusId, DiscussionTypes.COMMENT)
								.then(e => new Blob([ JSON.stringify(e, null, 4) ], { type: "application/json" }))
								.then(URL.createObjectURL)
								.then(url => ({ url, filename: `${id}.json`, saveAs: true } as Downloadable))
								.then(message => ({ message, type: MessageTypes.DOWNLOAD } as Message))
								.then(e => chrome.runtime.sendMessage(EXTENSION_ID, e))
								.catch(console.error);
						}
					});
					meta.appendChild(download);
				}

				item.classList.add(EXTENSION_ITEM_CLASSNAME);
			}
		}
	}
}

export {
	addReportButton,
	addReportButtonDiscussionPosts,
	addProfileReportButton
};
