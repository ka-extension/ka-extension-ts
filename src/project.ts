import { Program } from "./data";
import { formatDate } from "./util/text-util";

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

export { addProgramDates };
