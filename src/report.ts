import { buildQuery } from "./util/text-util";
import { Program } from "./types/data"
import { QUEUE_ROOT, EXTENSION_ITEM_CLASSNAME, EXTENSION_ID } from "./types/names";
import { getJSON, DiscussionTypes, getConvo } from "./util/api-util";
import { Message, MessageTypes, Downloadable } from "./types/message-types";

function addReportButton(program: Program, kaid: string) {
    const buttons: HTMLElement | null = document.querySelector(".buttons_vponqv");
    if (buttons && kaid != program.kaid) {
        let reportButton: HTMLAnchorElement = document.createElement("a");
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

function addReportButtonDiscussionPosts(focusId: string, focusKind: string) {
    const items: NodeListOf<HTMLDivElement> = document.querySelectorAll(
        `.question:not(.${EXTENSION_ITEM_CLASSNAME}), ` + 
        `.comment:not(.${EXTENSION_ITEM_CLASSNAME})`);
    for(let i = 0; i < items.length; i++) {
        let item: HTMLDivElement = items[i];
        let id: string = item.id;
        if(id.length > 0) {
            let meta: HTMLDivElement | null = item.getElementsByClassName("discussion-meta-controls")
                [0] as HTMLDivElement;
            if(meta) {
                let separator: HTMLSpanElement = document.createElement("span");
                separator.className = "discussion-meta-separator";
                separator.textContent = "•";
                let report: HTMLAnchorElement = document.createElement("a");
                report.href = `${QUEUE_ROOT}submit?${buildQuery({
                    type: "discussion",
                    id: `${item.classList.contains("comment") ? 
                        "comment" : "question"}|${focusKind}|${focusId}|${id}`,
                    callback: window.location.href
                })}`;
                report.textContent = "Report";
                meta.appendChild(separator);
                meta.appendChild(report);

                if(item.classList.contains("comment") && typeof Blob != "undefined" && typeof URL != "undefined") {
                    meta.appendChild(separator.cloneNode(true));
                    let download: HTMLAnchorElement = document.createElement("a");
                    download.href = "#";
                    download.setAttribute("data-key", id);
                    download.setAttribute("data-focus-id", focusId);
                    download.setAttribute("data-focus-kind", focusKind);
                    download.textContent = "Download conversation";
                    download.addEventListener("click", (e: MouseEvent) => {
                        e.preventDefault();
                        let target: HTMLAnchorElement = e.target as HTMLAnchorElement;
                        let key: string | null = target.getAttribute("data-key"), 
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

export { addReportButton, addReportButtonDiscussionPosts };