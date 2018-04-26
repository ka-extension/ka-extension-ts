import { Program, KA } from "./data";

function addProgramFlags(program: Program, kaid: string): void {
  const controls: HTMLElement = <HTMLElement> document.querySelector(".discussion-meta-controls");
  const programFlags: string[] = program.flags;
  const flagButton: HTMLElement = <HTMLElement> controls.childNodes[2];
  const reasons: string = programFlags.length > 0 ? programFlags.reduce((total, current) => total += `${current}\n`) : "No flags here!";
  const profileData: KA["_userProfileData"] = <KA["_userProfileData"]> (window as any)["KA"]._userProfileData;
  if(program.kaid !== kaid && profileData.isModerator === false) {
    flagButton.textContent += ` • ${programFlags.length}`;
    flagButton.title = reasons;
  }
}

export { addProgramFlags };
