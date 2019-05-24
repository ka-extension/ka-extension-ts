import { Program, UserProfileData } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { QUEUE_ROOT } from "./types/names";
import { getCSRF } from "./util/cookie-util";
import { buildQuery } from "./util/text-util";

//Replace KA's vote button with one that updates after you vote and allows undoing votes
function replaceVoteButton (buttons: HTMLDivElement, program: Program): void {
	const wrap = buttons.querySelector(".voting-wrap .discussion-meta-controls span");
	
	//TODO: Handle non-English
	if (!(wrap instanceof HTMLElement) || !wrap.innerText.includes("Vote")) {
		console.log("Voting failed to load.", buttons, wrap, wrap && wrap.firstChild);
		return;
	}

	const VOTE_URL = "/api/internal/discussions/voteentity";

	let voted = wrap.innerText.includes("Voted Up");

	const orgVotes = program.sumVotesIncremented - (voted ? 1 : 0);

	const newWrap = document.createElement("span");
	const voteButton = document.createElement("a");
	const voteText = document.createElement("span");
	voteButton.setAttribute("role", "button");
	voteButton.classList.add("kae-program-button");
	voteButton.appendChild(voteText);
	newWrap.appendChild(voteButton);

	function updateVoteDisplay () {
		voteText.innerText = (voted ? "Voted Up!" : "Vote Up") + " • " + (orgVotes + (voted ? 1 : 0));
	}
	updateVoteDisplay();

	const profileData: UserProfileData | undefined = <UserProfileData>(window as any).KA._userProfileData;
	if (!profileData || profileData.isPhantom) {
		console.log("Not logged in.", voteButton);
		voteButton.setAttribute("style", "cursor: default !important");
		voteButton.addEventListener("click", function () {
			alert("You must be logged in in order to vote.");
		});
	} else {
		newWrap.addEventListener("click", function () {
			voted = !voted;
			updateVoteDisplay();

			fetch(`${VOTE_URL}?entity_key=${program.key}&vote_type=${voted ? 1 : 0}`, {
				method: "POST",
				headers: { "X-KA-FKey": getCSRF() },
				credentials: "same-origin"
			}).then((response: Response): void => {
				if (response.status !== 204) {
					response.json().then((res: any): void => {
						if (res.error) {
							alert("Failed with error:\n\n" + res.error);
						}
					}).catch(() => {
						alert(`Voting failed with status ${response.status}`);
					});
					voted = !voted;
					updateVoteDisplay();
				}
			}).catch(console.error);
		});
	}

	if (wrap.parentNode) {
		wrap.parentNode.insertBefore(newWrap, wrap);
		wrap.parentNode.removeChild(wrap);
	}
}

//Add a "Copy Link" button
function addLinkButton (buttons: HTMLDivElement, program: Program): void {	
	const copyLinkButton: HTMLAnchorElement = document.createElement("a");
	copyLinkButton.id = "kae-link-button";

	copyLinkButton.setAttribute("role", "button");
	copyLinkButton.innerHTML = "<span>Copy Link</span>";
	copyLinkButton.classList.add("kae-program-button");
	copyLinkButton.addEventListener("click", function () {
		if ((window.navigator as any).clipboard) {
			(window.navigator as any).clipboard.writeText(`https://khanacademy.org/cs/i/${program.id}`).catch((err: Error) => {
				alert("Copying failed with error:\n" + err);
			});
		} else {
			try {
				const textArea = document.createElement("textarea");
				textArea.value = `https://khanacademy.org/cs/i/${program.id}`;
				copyLinkButton.parentElement!.insertBefore(textArea, copyLinkButton);
				textArea.focus();
				textArea.select();

				document.execCommand("copy");

				copyLinkButton.parentElement!.removeChild(textArea);
			} catch (err) {
				alert("Copying failed with error:\n" + err);
			}
		}
	});

	buttons.insertBefore(copyLinkButton, buttons.children[buttons.children.length - 1]);
	buttons.insertBefore(document.createTextNode(" "), copyLinkButton.nextSibling);
}

//Add the number of flags and title text to the program flag button
function addProgramFlags(buttons: HTMLDivElement, program: Program) {
	const controls = buttons.querySelector(".discussion-meta-controls")

	if (!controls) {
		console.log(buttons);
		throw new Error("Button controls should be loaded.");
	}
	
	const programFlags: string[] = program.flags;
	const flagButton: HTMLElement = <HTMLElement>controls.childNodes[2];
	const reasons: string = programFlags.length > 0 ? programFlags.reduce((total, current) => total += `${current}\n`) : "No flags here!";
	const profileData: UserProfileData | undefined = <UserProfileData>(window as any).KA._userProfileData;
	//TODO: Allow viewing flags on your own program (where there's normally not a flag button)
	if (profileData && profileData.kaid !== program.kaid && profileData.isModerator === false) {
		flagButton.textContent += ` • ${programFlags.length}`;
		flagButton.title = reasons;
	}
}

//Add a button to report the program
function addProgramReportButton (buttons: HTMLDivElement, program: Program, kaid: string) {
	if (kaid !== program.kaid) {
		const reportButton: HTMLAnchorElement = document.createElement("a");
		reportButton.id = "kae-report-button";
		reportButton.classList.add("kae-program-button");
		reportButton.href = `${QUEUE_ROOT}submit?${buildQuery({
			type: "program",
			id: program.id.toString(),
			callback: window.location.href
		})}`;
		reportButton.setAttribute("role", "button");
		reportButton.innerHTML = "<span>Report</span>";
		buttons.insertBefore(reportButton, buttons.children[1]);
		buttons.insertBefore(document.createTextNode(" "), reportButton.nextSibling);
	}
}

function findOtherButtons (buttons: HTMLDivElement): void {
	/*Add the kae-program-button class to all other program buttons so we can restyle them */
	Array.from(buttons.querySelectorAll("a[role=\"button\"]")).forEach(el => el.classList.add("kae-program-button"));
}

function loadButtonMods (program: Program): void {
	const kaid:string = (window as any).KA.kaid;
	
	querySelectorPromise(".voting-wrap")
		.then(votingWrap => votingWrap.parentNode)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			findOtherButtons(buttons);
			addLinkButton(buttons, program);
			replaceVoteButton(buttons, program);
			addProgramFlags(buttons, program);
			addProgramReportButton(buttons, program, kaid);
		});
	
	querySelectorPromise("#child-account-notice")
		.then(childNotice => childNotice as HTMLSpanElement)
		.then(childNotice => childNotice.parentNode)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			findOtherButtons(buttons);
			addLinkButton(buttons, program);
			//TODO, let voting run here too
		});
		
	//TODO: 
	//Find the buttons wrap on offical project pages (maybe for voting or link copying. Might not be useful)
	//https://www.khanacademy.org/computing/computer-programming/programming/drawing-basics/pc/challenge-waving-snowman
}

export { loadButtonMods };
