import { buildQuery } from "./util/text-util";
import { Program } from "./data"
import { QUEUE_ROOT } from "./names";

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

export { addReportButton };