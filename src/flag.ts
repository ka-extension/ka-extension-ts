import { Program, UserProfileData } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";

function addProgramFlags (program: Program, kaid: string): void {
	querySelectorPromise(".discussion-meta-controls")
		.then(controls => controls as HTMLElement)
		.then(controls => {
			const programFlags: string[] = program.flags;
			const flagButton: HTMLElement = <HTMLElement>controls.childNodes[2];
			const reasons: string = programFlags.length > 0 ? programFlags.reduce((total, current) => total += `${current}\n`) : "No flags here!";
			const profileData = window.KA._userProfileData;
			if (program.kaid !== kaid && profileData && profileData.isModerator === false) {
				flagButton.textContent += ` • ${programFlags.length}`;
				flagButton.title = reasons;
			}
		})
		.catch(console.error);
}

export { addProgramFlags };
