import { Program } from "./data";
import { formatDate } from "./util/text-util";
import { LS_PREFIX } from "./names";

function addProgramDates(program: Program, uok: string): void {
  const profilePrograms: HTMLAnchorElement | null = <HTMLAnchorElement> document.querySelector(".profile-programs");
  if(profilePrograms && profilePrograms.nextElementSibling) {
    const updatedSpan: HTMLSpanElement = <HTMLSpanElement> profilePrograms.nextElementSibling;
    const updated: string = formatDate(program.date);
    const created: string = formatDate(program.created);
    updatedSpan.innerHTML += `<br>Created: ${created}`;
    updatedSpan.innerHTML += `<br>Updated: ${updated}`;
    if(program.kaid === uok) {
      const flagSpan: HTMLDivElement = <HTMLDivElement> document.createElement("div");
      flagSpan.title = program.flags.join("\n");
      flagSpan.innerHTML += `Flags: ${program.flags.length}`;
      updatedSpan.appendChild(flagSpan);
    }
    const hidden: boolean = program.hideFromHotlist;
    const isHiddenElm: HTMLDivElement = <HTMLDivElement> document.createElement("div");
    isHiddenElm.style.color = (hidden ? "#af2f18" : "#18af18");
    isHiddenElm.innerHTML += `This project is ${hidden ? '' : 'not '}hidden from the hotlist.`;
    updatedSpan.appendChild(isHiddenElm);
  }
}

function hideEditor(program: Program): void {
  console.log('Running!');
  const wrap: HTMLDivElement | null = <HTMLDivElement> document.querySelector(".wrapScratchpad_1jkna7i");
  if(wrap && program.userAuthoredContentType !== "webpage") {
    const editor: HTMLDivElement = <HTMLDivElement> document.querySelector(".scratchpad-editor-wrap");
    const lsEditorId: string = `${LS_PREFIX}editor-hide`;
    let lsEditorVal: string | null = <string> localStorage.getItem(lsEditorId);
    console.log('Editor hide ls value is', lsEditorVal);
    if(lsEditorVal && lsEditorVal === "true") {
      editor.classList.toggle("kae-hide");
      wrap.classList.toggle(`kae-hide-${program.width.toString()}`);
    }
    const hideDiv: HTMLDivElement = <HTMLDivElement> document.createElement("div");
    const hideButton: HTMLAnchorElement = <HTMLAnchorElement> document.createElement("a");
    hideDiv.id = "kae-hide-div";
    hideButton.id = "kae-hide-button";
    hideButton.href = "javascript:void(0)";
    hideButton.className = "link_1uvuyao-o_O-computing_1w8n1i8";
    hideButton.textContent = "Toggle Editor";
    hideButton.addEventListener("click", () : void => {
      lsEditorVal = lsEditorVal === "true" ? "false" : "true";
      localStorage.setItem(lsEditorId, lsEditorVal);
      editor.classList.toggle("kae-hide");
      wrap.classList.toggle(`kae-hide-${program.width.toString()}`);
    });
    const wrapParent: HTMLDivElement | null = <HTMLDivElement> wrap.parentNode;
    if(wrapParent) {
      hideDiv.appendChild(hideButton);
      wrapParent.insertBefore(hideDiv, wrap);
    }
  }
}

export { addProgramDates, hideEditor };
