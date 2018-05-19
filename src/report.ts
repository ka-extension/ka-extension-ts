import { buildQuery } from "./util/text-util";
import { Program } from "./data"
import { QUEUE_ROOT, EXTENSION_ITEM_CLASSNAME } from "./names";

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
        `.question:not(.is-author):not(.${EXTENSION_ITEM_CLASSNAME}), ` + 
        `.comment:not(.is-author):not(.${EXTENSION_ITEM_CLASSNAME})`);
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
                item.classList.add(EXTENSION_ITEM_CLASSNAME);
            }
        }
    }
}

export { addReportButton, addReportButtonDiscussionPosts };