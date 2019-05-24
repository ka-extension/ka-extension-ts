import { Program, UserProfileData } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { getCSRF } from "./util/cookie-util";

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

function findOtherButtons (buttons: HTMLDivElement): void {
	/*Add the kae-program-button class to all other program buttons so we can restyle them */
	Array.from(buttons.querySelectorAll("a[role=\"button\"]")).forEach(el => el.classList.add("kae-program-button"));
}

function loadButtonMods (program: Program): void {
	querySelectorPromise(".voting-wrap")
		.then(votingWrap => votingWrap.parentNode)
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			findOtherButtons(buttons);
			addLinkButton(buttons, program);
			replaceVoteButton(buttons, program);
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
