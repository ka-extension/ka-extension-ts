import * as updateLog from "../resources/update-log.json";

interface LogEntry {
    version: string;
    new: string[];
    fixes: string[];
}

let currentPage: number = 0;

const log: LogEntry[] = <LogEntry[]>Object.assign([], updateLog);

const version: HTMLElement | null = document.getElementById("version");
const newFeatures: HTMLElement | null = document.getElementById("new");
const fixes: HTMLElement | null = document.getElementById("fixes");

const next: HTMLElement | null = document.getElementById("next");
const previous: HTMLElement | null = document.getElementById("previous");

function elementWithText(tag: string, text: string): HTMLElement {
    const element: HTMLElement = document.createElement("li");
    element.textContent = text;
    return element;
}

function page(i: number): void {
    version!.textContent = log[i].version;
    newFeatures!.innerHTML = fixes!.innerHTML = "";
    log[i].new.map(e => elementWithText("li", e)).forEach(e => newFeatures!.appendChild(e));
    log[i].fixes.map(e => elementWithText("li", e)).forEach(e => fixes!.appendChild(e));
}

next!.addEventListener("click", e => currentPage > 0 && page(--currentPage));
previous!.addEventListener("click", e => currentPage < log.length - 1 && page(++currentPage));

page(0);