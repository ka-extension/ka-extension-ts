import { Program } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { getKAID } from "./util/data-util";
import { setVote } from "./util/graphql-util";

//Replace KA's vote button with one that updates after you vote and allows undoing votes
function replaceVoteButton (buttons: HTMLDivElement, program: Program) : void {
	buttons.id = "buttons-wrap";
	querySelectorPromise("#buttons-wrap .discussion-meta-controls > button:first-child").then(wrap => {
		//TODO: Handle non-English
		if (!(wrap instanceof HTMLElement) || !wrap.innerText.includes("Vote")) {
			console.log("Voting failed to load.", buttons, wrap, wrap && wrap.firstChild);
			return;
		}

		let voted = wrap.innerText.includes("Voted Up");
		const orgVotes = program.sumVotesIncremented - (voted ? 1 : 0);

		const newWrap = document.createElement("span"),
			voteText = document.createElement("span"),
			voteButton = document.createElement("button");

		voteButton.setAttribute("role", "button");
		voteButton.classList.add("kae-program-button");
		voteButton.appendChild(voteText);

		newWrap.appendChild(voteButton);

		function updateVoteDisplay (toggle = false) {
			if (toggle) {
				voted = !voted;
			}
			voteText.innerText = (voted ? "Voted Up!" : "Vote Up") + 
				" • " + (orgVotes + (voted ? 1 : 0));
		}
		updateVoteDisplay();

		newWrap.addEventListener("click", () => {
			updateVoteDisplay(true);
			setVote(program.key, !voted)
				.catch(e => {
					updateVoteDisplay(true);
					console.error(e);
				});
		});

		if (wrap.parentNode) {
			wrap.parentNode.insertBefore(newWrap, wrap);
			wrap.parentNode.removeChild(wrap);
		}
	});
}

//Add a "Copy Link" button
function addLinkButton (buttons: HTMLDivElement, program: Program): void {
	if (document.getElementById("kae-link-button")) {
		return;
	}

	const copyLinkButton: HTMLButtonElement = document.createElement("button");
	copyLinkButton.id = "kae-link-button";

	const copyLinkText:HTMLSpanElement = document.createElement("span");
	copyLinkText.appendChild(document.createTextNode("Copy Link"));
	copyLinkButton.setAttribute("role", "button");
	copyLinkButton.appendChild(copyLinkText);
	copyLinkButton.classList.add("kae-program-button");
	copyLinkButton.style.marginLeft = "12px";
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

	buttons.insertBefore(copyLinkButton, buttons.children[buttons.children.length - 1]);
	buttons.insertBefore(document.createTextNode(" "), copyLinkButton.nextSibling);
}

//Add the number of flags and title text to the program flag button
function addProgramFlags (buttons: HTMLDivElement, program: Program) {
	const controls = buttons.querySelector(".discussion-meta-controls");

	if (!controls) {
		console.log(buttons);
		throw new Error("Button controls should be loaded.");
	}

	const programFlags: string[] = program.flags;
	const flagButton: HTMLElement = <HTMLElement>controls.childNodes[2];
	const reasons: string = programFlags.length > 0 ? programFlags.reduce((total, current) => total += `${current}\n`) : "No flags here!";
	const kaid = getKAID();
	//TODO: Allow viewing flags on your own program (where there's normally not a flag button)
	//TODO: Bug: errors on offical programs (no flag button)
	if (kaid !== program.kaid) {
		flagButton.textContent += ` • ${programFlags.length}`;
		flagButton.title = reasons;
	}
}

function findOtherButtons (buttons: HTMLDivElement): void {
	/*Add the kae-program-button class to all other program buttons so we can restyle them */
	Array.from(buttons.querySelectorAll("a[role=\"button\"]")).forEach(el => el.classList.add("kae-program-button"));
}

function loadButtonMods (program: Program): void {
	querySelectorPromise("[data-user-kaid]")
		.then(userLink => userLink as HTMLAnchorElement)
		.then(userLink => userLink.parentNode!.parentNode!.firstElementChild)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			// findOtherButtons(buttons);
			addLinkButton(buttons, program);
			replaceVoteButton(buttons, program);
			// addProgramFlags(buttons, program);
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

	//TODO: Find the buttons wrap on official project pages (maybe for voting or link copying. Might not be useful)
	//https://www.khanacademy.org/computing/computer-programming/programming/drawing-basics/pc/challenge-waving-snowman
}

export { loadButtonMods };
