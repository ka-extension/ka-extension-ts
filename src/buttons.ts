import { Program } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { QUEUE_ROOT } from "./types/names";
import { getCSRF } from "./util/cookie-util";
import { buildQuery } from "./util/text-util";
import { getKAID } from "./util/data-util";

//Replace KA's vote button with one that updates after you vote and allows undoing votes
function replaceVoteButton (buttons: HTMLDivElement, program: Program): void {
	const wrap = buttons.querySelector(".discussion-meta .discussion-meta-controls span");

	//TODO: Handle non-English
	if (!(wrap instanceof HTMLElement) || !wrap.innerText.includes("Vote")) {
		console.log("Voting failed to load.", buttons, wrap, wrap && wrap.firstChild);
		return;
	}

	const VOTE_URL = "/api/internal/discussions/voteentity";

	let voted = wrap.innerText.includes("Voted Up");

	const orgVotes = program.sumVotesIncremented - (voted ? 1 : 0);

	const voteText = document.createElement("span");

	function updateVoteDisplay () {
		voteText.innerText = (voted ? "Voted Up!" : "Vote Up") + " • " + (orgVotes + (voted ? 1 : 0));
	}
	updateVoteDisplay();

	voteText.addEventListener("click", function () {
		voted = !voted;
		updateVoteDisplay();

		fetch(`${VOTE_URL}?entity_key=${program.key}&vote_type=${voted ? 1 : 0}`, {
			method: "POST",
			headers: { "X-KA-FKey": getCSRF() },
			credentials: "same-origin"
		}).then((response: Response): void => {
			//If there's an error, undo the vote
			if (response.status !== 204) {
				response.json().then((res: { error?: string }): void => {
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

//Add a "Copy Link" button
function addLinkButton (buttons: HTMLDivElement, program: Program): void {
	const copyLinkButton = document.createElement("button");
	copyLinkButton.id = "kae-link-button";
	copyLinkButton.classList.add("_1s8r0xd3");
	copyLinkButton.addEventListener("click", function () {
		if (window.navigator.hasOwnProperty("clipboard")) {
			window.navigator.clipboard.writeText(`https://khanacademy.org/cs/i/${program.id}`).catch((err: Error) => {
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

	const spacing = document.createElement("div");
	spacing.className = "_4bsxcct";

	const copyLinkText = document.createElement("span");
	copyLinkText.className = "_1alfwn7n";
	copyLinkText.textContent = "Copy Link";
	copyLinkButton.appendChild(copyLinkText);

	buttons.insertBefore(spacing, buttons.children[buttons.children.length - 1]);
	buttons.insertBefore(copyLinkButton, spacing.nextSibling);
}

//Add the number of flags and title text to the program flag button
function addProgramFlags (buttons: HTMLDivElement, program: Program) {
	const controls = buttons.querySelector(".discussion-meta-controls");

	if (!controls) {
		console.log(buttons);
		throw new Error("Button controls should be loaded.");
	}

	if (controls.childNodes.length < 2) {
		const flagButton = document.createElement("button");
		flagButton.id = "kae-flag-button";
		flagButton.classList.add("_1s8r0xd3");
		flagButton.setAttribute("tabindex", "0");

		const spacing = document.createElement("span");
		const spacingSeparator = document.createElement("span");
		spacingSeparator.className = "discussion-meta-separator";
		spacing.appendChild(spacingSeparator);

		const flagButtonText = document.createElement("span");
		flagButtonText.className = "_1alfwn7n";
		flagButtonText.textContent = "Flag";
		flagButton.appendChild(flagButtonText);
		controls.appendChild(spacing);
		controls.insertBefore(flagButton, spacing.nextSibling);
	}

	const flagButton = controls.childNodes[2];
	const programFlags: string[] = program.flags;
	const reasons: string = programFlags.length > 0 ? programFlags.reduce((total, current) => total += `${current}\n`) : "No flags here!";
	flagButton.childNodes[0].textContent = `Flag • ${programFlags.length}`;
}

//Add a button to report the program
function addProgramReportButton (buttons: HTMLDivElement, program: Program, kaid: string) {
	if (kaid !== program.kaid) {
		const reportButton: HTMLAnchorElement = document.createElement("a");
		reportButton.id = "kae-report-button";
		reportButton.classList.add("_1s8r0xd3");
		reportButton.href = `${QUEUE_ROOT}submit?${buildQuery({
			type: "program",
			id: program.id.toString(),
			callback: window.location.href
		})}`;
		reportButton.setAttribute("role", "button");
		const reportText = document.createElement("span");
		reportText.className = "_1alfwn7n";
		reportText.textContent = "Report";
		reportButton.appendChild(reportText);

		const spacing = document.createElement("div");
		spacing.className = "_4bsxcct";

		buttons.insertBefore(spacing, buttons.children[1]);
		buttons.insertBefore(reportButton, spacing.nextSibling);
	}
}

function loadButtonMods (program: Program): void {
	const kaid:string = getKAID();

	querySelectorPromise("._7z5jsor")
		.then(votingWrap => votingWrap)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			addLinkButton(buttons, program);
			addProgramReportButton(buttons, program, kaid);
		});

	querySelectorPromise(".discussion-meta")
		.then(votingWrap => votingWrap.parentNode)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			replaceVoteButton(buttons, program);
			addProgramFlags(buttons, program);
		});

	querySelectorPromise("#child-account-notice")
		.then(childNotice => childNotice as HTMLSpanElement)
		.then(childNotice => childNotice.parentNode)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			addLinkButton(buttons, program);
			//TODO, let voting run here too
		});

	//TODO: Find the buttons wrap on offical project pages (maybe for voting or link copying. Might not be useful)
	//https://www.khanacademy.org/computing/computer-programming/programming/drawing-basics/pc/challenge-waving-snowman
}

export { loadButtonMods };
