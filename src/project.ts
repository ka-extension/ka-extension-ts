import { Program, UserProfileData } from "./types/data";
import { formatDate } from "./util/text-util";
import { PREFIX, DARK_THEME } from "./types/names";
import { querySelectorPromise } from "./util/promise-util";
import { getCSRF } from "./util/cookie-util";
import monokai from "../styles/ace-themes/monokai.css";
import textmate from "../styles/ace-themes/textmate.css";

const themes: { [key: string]: string } = {};

const enum BUTTON_CLASSES {
	default	= "link_1uvuyao-o_O-computing_77ub1h",
	active	= "link_1uvuyao-o_O-computing_1w8n1i8",
}

const aceThemes = {
	addTheme (themeName: string, css: string) {
		themes[themeName] = css.replace(new RegExp("\\.ace-" + themeName, "ig"), ".ace-tm");
	},
	getThemeCSS (themeName: string): string | null {
		return themes[themeName];
	}
};

aceThemes.addTheme("monokai", monokai);
aceThemes.addTheme("tm", textmate);

function tableRow (key: string, val: string, title?: string): HTMLTableRowElement {
	const tr = document.createElement("tr");

	const keyElm: HTMLTableDataCellElement = <HTMLTableDataCellElement> document.createElement("td");
	keyElm.className = "kae-td";

	const valElm: HTMLTableDataCellElement = <HTMLTableCellElement> keyElm.cloneNode();
	keyElm.textContent = key;
	valElm.textContent = val;

	if(title){
		valElm.title = title;
	}

	tr.appendChild(keyElm);
	tr.appendChild(valElm);

	return tr;
}

function addProgramInfo (program: Program, uok: string): void {
	querySelectorPromise(".profile-programs")
	.then(profileLink => profileLink as HTMLAnchorElement)
	.then(profileLink => {
		if (profileLink && profileLink.nextElementSibling) {
			const updatedSpan: HTMLSpanElement = <HTMLSpanElement> profileLink.nextElementSibling;
			const table = document.createElement("table");
			table.className = "kae-table";

			const updated: string = formatDate(program.date);
			const created: string = formatDate(program.created);
			const hidden: boolean = program.hideFromHotlist;
			const approved: boolean = program.definitelyNotSpam;

			if (program.kaid === uok){
				table.appendChild(tableRow("Flags", program.flags.length.toString(), program.flags.join("\n")));
			}

			table.appendChild(tableRow("Hidden from Hotlist", hidden ? "Yes" : "No"));
			table.appendChild(tableRow("Guardian Approved", approved ? "Yes" : "No"));
			if (updated !== created) {
				table.appendChild(tableRow("Updated", updated));
			}
			table.appendChild(tableRow("Created", created));
			updatedSpan.appendChild(table);
		}
	});
}

function hideEditor (program: Program): void {
	const wrap: HTMLDivElement | null = <HTMLDivElement> document.querySelector(".wrapScratchpad_1jkna7i");
	if (wrap && program.userAuthoredContentType !== "webpage") {
		const editor: HTMLDivElement = <HTMLDivElement> document.querySelector(".scratchpad-editor-wrap");
		const lsEditorId: string = `${PREFIX}editor-hide`;
		let lsEditorVal: string | null = <string> localStorage.getItem(lsEditorId);
		if (lsEditorVal && lsEditorVal === "true") {
			editor.classList.toggle("kae-hide");
			wrap.classList.toggle(`kae-hide-${program.width.toString()}`);
		}
		const hideDiv: HTMLDivElement = <HTMLDivElement> document.createElement("div");
		const hideButton: HTMLAnchorElement = <HTMLAnchorElement> document.createElement("a");
		hideDiv.id = "kae-hide-div";
		hideButton.id = "kae-hide-button";
		hideButton.href = "javascript:void(0)";
		hideButton.className = BUTTON_CLASSES.active;
		hideButton.textContent = "Toggle Editor";
		hideButton.addEventListener("click", () : void => {
			lsEditorVal = lsEditorVal === "true" ? "false" : "true";
			localStorage.setItem(lsEditorId, lsEditorVal);
			editor.classList.toggle("kae-hide");
			wrap.classList.toggle(`kae-hide-${program.width.toString()}`);
		});
		const wrapParent: HTMLDivElement | null = <HTMLDivElement> wrap.parentNode;
		if (wrapParent) {
			hideDiv.appendChild(hideButton);
			wrapParent.insertBefore(hideDiv, wrap);
		}
	}
}

//Replace KA's vote button with one that updates after you vote and allows undoing votes
function replaceVoteButton (program: Program): void {
	querySelectorPromise(".voting-wrap .discussion-meta-controls span")
	.then(wrap => {
		if (!(wrap instanceof HTMLElement) || !wrap.innerText.includes("Vote")) {
			console.log("Voting failed to load.", wrap, wrap.firstChild);
			return;
		}



		const voteURL = "https://www.khanacademy.org/api/internal/discussions/voteentity";

		let voted = wrap.innerText.includes("Voted Up");

		const orgVotes = program.sumVotesIncremented - (voted ? 1 : 0);

		const newWrap = document.createElement("span");
		const voteButton = document.createElement("a");
		const voteText = document.createElement("span");
		voteButton.appendChild(voteText);
		newWrap.appendChild(voteButton);

		function updateVoteDisplay () {
			voteText.innerText = (voted ? "Voted Up!" : "Vote Up") + " • " + (orgVotes + (voted ? 1 : 0));
			voteButton.classList.remove(voted ? BUTTON_CLASSES.default : BUTTON_CLASSES.active);
			voteButton.classList.add(voted ? BUTTON_CLASSES.active : BUTTON_CLASSES.default);
		}

		updateVoteDisplay();

		const profileData: UserProfileData | undefined = <UserProfileData> (window as any).KA._userProfileData;
		if (!profileData || profileData.isPhantom) {
			console.log("Not logged in.", voteButton);
			voteButton.classList.remove(BUTTON_CLASSES.active);
			voteButton.classList.add(BUTTON_CLASSES.default);
			voteButton.setAttribute("style", "cursor: default !important");
			voteButton.addEventListener("click", function () {
				alert("You must be logged in in order to vote.");
			});
		}else {
			newWrap.addEventListener("click", function () {
				voted = !voted;
				updateVoteDisplay();

				fetch(`${voteURL}?entity_key=${program.key}&vote_type=${voted ? 1 : 0}`, {
					method: "POST",
					headers: {	"X-KA-FKey": getCSRF()	}
				}).then((response: Response): void => {
					if (response.status !== 204) {
						response.json().then((res: any): void => {
							if (res.error) {
								alert("Failed with error:\n\n" + res.error);
								voted = !voted;
								updateVoteDisplay();
							}
						});
					}
				});
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
				})
			}else {
				try {
					var textArea = document.createElement("textarea");
					textArea.value = `https://khanacademy.org/cs/i/${program.id}`;
					copyLinkButton.parentElement!.insertBefore(textArea, copyLinkButton);
					textArea.focus();
					textArea.select();

					document.execCommand('copy');

					copyLinkButton.parentElement!.removeChild(textArea);
				} catch (err) {
					alert("Copying failed with error:\n" + err);
				}
			}

			copyLinkButton.classList.replace(BUTTON_CLASSES.default, BUTTON_CLASSES.active);
			setTimeout(() => {
				copyLinkButton.setAttribute('style', "transition: all 0.75s !important");
				copyLinkButton.classList.replace(BUTTON_CLASSES.active, BUTTON_CLASSES.default);

				setTimeout(() => copyLinkButton.setAttribute('style', ""), 0.75 * 1000);
			}, 0.25 * 1000);
		})

		buttons.insertBefore(copyLinkButton, buttons.children[buttons.children.length-1]);
	})
}

function keyboardShortcuts (program: Program): void {
	document.addEventListener("keydown", (e: KeyboardEvent) : void => {
		if (!e.ctrlKey || !e.altKey) { return; }
		e.preventDefault();
		switch(e.which) {
			case 82: // R - Restart program
				const restartButton: HTMLAnchorElement | null = <HTMLAnchorElement> document.querySelector("#restart-code");
				if (restartButton) { restartButton.click(); }
				break;
			case 68: // D - Toggle documentation
				const firstLink: HTMLAnchorElement | null = <HTMLAnchorElement> document.querySelector(".link_1uvuyao-o_O-tabTrigger_pbokdw-o_O-inactiveTab_1t8hj6j");
				if (firstLink) { firstLink.click(); }
				break;
			case 80: // P - Go to the profile of program creator
				window.location.href = `${window.location.origin}/profile/${program.kaid}`;
				break;
		}
	});
}

function darkTheme () {
	const sid = "ka-extension-ace-override";

	const prevStyle = document.getElementById(sid);
	if (document.getElementById(sid) && prevStyle) {
		document.body.removeChild(prevStyle);
	}

	const s = document.createElement("style");
	s.id = sid;

	const currentInd = parseInt(localStorage.getItem(DARK_THEME) || "0", 10);
	s.innerHTML = aceThemes.getThemeCSS(currentInd ? "monokai" : "tm") || "";

	document.body.appendChild(s);
}

/*** Add a "Toggle Darkmode" button for programs ***/
async function darkToggleButton () {
	const rightArea = await querySelectorPromise(".right_piqaq3");

	const outerButtonSpan = document.createElement("span");
	outerButtonSpan.className = "pull-right";

	const innerButtonLink: HTMLAnchorElement = document.createElement("a");
	innerButtonLink.id = "kae-toggle-dark";
	innerButtonLink.href = "javascript:void(0)";
	innerButtonLink.textContent = "Toggle Dark Theme";
	innerButtonLink.addEventListener("mouseover", () => innerButtonLink.style.background = "#484848");
	innerButtonLink.addEventListener("mouseout", () => innerButtonLink.style.background = "#656565");
	innerButtonLink.addEventListener("click", () => {
		const currentInd = parseInt(localStorage.getItem(DARK_THEME) || "0", 10);
		const next = currentInd ^ 1;
		localStorage.setItem(DARK_THEME, next.toString());
		darkTheme();
	});

	outerButtonSpan.appendChild(innerButtonLink);
	rightArea.appendChild(outerButtonSpan);
}

darkTheme();

export { addProgramInfo, hideEditor, keyboardShortcuts, darkToggleButton, replaceVoteButton, addLinkButton};
