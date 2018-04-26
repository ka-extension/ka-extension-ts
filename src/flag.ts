import { Program } from "./data";
import { Extension } from "./extension";
const addProgramFlags = function(program: Program, kaid: string){
  const controls = <HTMLElement> document.querySelector(".discussion-meta-controls");
  const programFlags: string[] = program.flags;
  const flagButton = <HTMLElement> controls.childNodes[2];
  const reasons: string = programFlags.length > 0 ? programFlags.reduce((total, current) => total += `${current}\n`) : 'No flags here!';
  if(program.kaid === kaid) return;
  flagButton.textContent += ` • ${programFlags.length}`;
  flagButton.title = reasons;

}
export { addProgramFlags };
