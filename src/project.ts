import { Program } from "./data";
import { formatDate } from "./util/text-util";

function addProgramDates(program: Program, uok: string): void {
  const profilePrograms: HTMLAnchorElement = <HTMLAnchorElement> document.querySelector(".profile-programs");
  if(profilePrograms && profilePrograms.nextElementSibling) {
    const updatedSpan: HTMLSpanElement | null = <HTMLSpanElement> profilePrograms.nextElementSibling;
    const updated: string = <string> formatDate(program.date);
    const created: string = <string> formatDate(program.created);
    updatedSpan.innerHTML += <string> `<br>Created: ${created}`;
    updatedSpan.innerHTML += <string> `<br>Updated: ${updated}`;
    if(program.kaid === uok) {
      const flagSpan: HTMLDivElement = <HTMLDivElement> document.createElement("div");
      flagSpan.title= <string> program.flags.join("\n");
      flagSpan.innerHTML += <string> `Flags: ${program.flags.length}`;
      updatedSpan.appendChild(<HTMLDivElement> flagSpan);
    }
    const hidden: boolean = <boolean> program.hideFromHotlist;
    const isHiddenElm: HTMLDivElement = <HTMLDivElement> document.createElement("div");
    isHiddenElm.style.color = <string> (hidden ? "#af2f18" : "#18af18");
    isHiddenElm.innerHTML += <string> `This project is ${hidden ? '' : 'not '}hidden from the hotlist.`;
    updatedSpan.appendChild(<HTMLDivElement> isHiddenElm);
  }
}

export { addProgramDates };
