import { Program, UserProfileData } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { getCSRF } from "./util/cookie-util";

const enum BUTTON_CLASSES {
	default = "link_1uvuyao-o_O-computing_77ub1h",
	active = "link_1uvuyao-o_O-computing_1w8n1i8",
}

//Replace KA's vote button with one that updates after you vote and allows undoing votes
function replaceVoteButton (program: Program): void {
	querySelectorPromise(".voting-wrap .discussion-meta-controls span")
		.then(wrap => {
			if (!(wrap instanceof HTMLElement) || !wrap.innerText.includes("Vote")) {
				console.log("Voting failed to load.", wrap, wrap.firstChild);
				return;
			}

			const VOTE_URL = "/api/internal/discussions/voteentity";

			let voted = wrap.innerText.includes("Voted Up");

			const orgVotes = program.sumVotesIncremented - (voted ? 1 : 0);

			const newWrap = document.createElement("span");
			const voteButton = document.createElement("a");
			const voteText = document.createElement("span");
			voteButton.appendChild(voteText);
			voteButton.classList.add(BUTTON_CLASSES.default);
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
							});
							voted = !voted;
							updateVoteDisplay();
							alert(`Voting failed with status ${response.status}`);
						}
					}).catch(console.error);
				});
			}

			if (wrap.parentNode) {
				wrap.parentNode.insertBefore(newWrap, wrap);
				wrap.parentNode.removeChild(wrap);
			}
		}).catch(console.error);
}

//Add a "Copy Link" button
function addLinkButton (program: Program): void {
	querySelectorPromise(".buttons_vponqv")
		.then(buttons => buttons as HTMLDivElement)
		.then(buttons => {
			console.log(buttons);
			const copyLinkButton: HTMLAnchorElement = document.createElement("a");
			copyLinkButton.id = "kae-link-button";

			copyLinkButton.setAttribute("role", "button");
			copyLinkButton.innerHTML = "<span>Copy Link</span>";
			copyLinkButton.classList.add(BUTTON_CLASSES.default);
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
		});
}

export { BUTTON_CLASSES, addLinkButton, replaceVoteButton };
