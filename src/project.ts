import { Program, CachedRevision } from "./types/data";
import { TIME_PERIODS } from "./types/names";
import { formatDate } from "./util/text-util";
import { querySelectorPromise, wait } from "./util/promise-util";
import { addEditorSettings } from "./editor-settings";
import { EXTENSION_EDITOR_BUTTON } from "./types/names";
import { getKAID } from "./util/data-util";

function tableRow (key: string, val: string, title?: string): HTMLTableRowElement {
	const tr = document.createElement("tr");

	const keyElm = document.createElement("td"),
		valElm = document.createElement("td");

	valElm.className = keyElm.className = "kae-td";

	keyElm.textContent = key;
	valElm.textContent = val;

	if (title) {
		valElm.title = title;
	}

	tr.appendChild(keyElm);
	tr.appendChild(valElm);

	return tr;
}

function addProgramInfo (program: Program, uok: string): void {
	querySelectorPromise("[data-user-kaid]")
		.then(userLink => userLink as HTMLAnchorElement)
		.then(userLink => userLink.parentNode)
		.then(wrapDiv => wrapDiv as HTMLDivElement)
		.then(wrapDiv => wrapDiv.parentNode)
		.then(wrapDiv => wrapDiv as HTMLDivElement)
		.then(wrapDiv => {
			if (document.getElementsByClassName("kae-table").length > 0) {
				return;
			}

			const table = document.createElement("table");
			table.className = "kae-table";

			const updated: string = formatDate(program.date);
			const created: string = formatDate(program.created);
			const hidden: boolean = program.hideFromHotlist;
			const approved: boolean = program.definitelyNotSpam;

			if (program.kaid === uok) {
				table.appendChild(tableRow("Flags", program.flags.length.toString(), program.flags.join("\n")));
			}

			//Hidden		 No | From Hotlist | Completely | Guardian Approved
			const hiddenRow = table.appendChild(tableRow("Hidden?", hidden ? "From Hotlist" : (approved ? "Guardian Approved" : "No")));

			const statusTd = hiddenRow.querySelector(".kae-td:last-child") as HTMLElement;
			if (hidden) {
				/*const programShowAPI = "https://www.khanacademy.org/api/internal/show_scratchpad?projection={}&scratchpad_id=";

				fetch(programShowAPI + program.id).then((response: Response): void => {
					if (response.status === 404) {
						statusTd.innerHTML = "Completely";
						statusTd.style.color = "red";
					}
				}).catch(console.error);*/

				statusTd.style.color = "orange";
			} else if (approved) {
				statusTd.style.color = "green";
			}

			if (updated !== created) {
				table.appendChild(tableRow("Updated", updated));
			}
			table.appendChild(tableRow("Created", created));
			wrapDiv.appendChild(table);
		});
}

function keyboardShortcuts (program: Program): void {
	document.addEventListener("keydown", (e: KeyboardEvent): void => {
		if (!e.ctrlKey || !e.altKey) { return; }
		e.preventDefault();
		switch (e.which) {
			case 82: // R - Restart program
				const restartButton: HTMLAnchorElement | null = <HTMLAnchorElement>document.querySelector("#restart-code");
				if (restartButton) { restartButton.click(); }
				break;
			case 80: // P - Go to the profile of program creator
				window.location.href = `${window.location.origin}/profile/${program.kaid}`;
				break;
		}
	});
}

function checkHiddenOrDeleted () {
	const idMatch = window.location.href.split("/")[5].match(/^\d{10,16}/g);
	if (!idMatch) {
		return;
	}
	const id = idMatch[0];

	const textWrap = document.querySelector("#four-oh-four > div > div:last-child")!;

	const API_URL = `https://www.khanacademy.org/api/internal/scratchpads/${id}`;

	const msg = document.createElement("div");
	msg.style.marginTop = "25px";
	msg.innerHTML = "Checking program...";
	textWrap.appendChild(msg);
	fetch(`${API_URL}?projection={}`).then((response: Response): void => {
		if (response.status === 200) {
			const PROGRAM_VIEW = `https://khan.github.io/live-editor/demos/simple/?scratchpad=${id}`;

			msg.innerHTML = `This <a class="kae-white" style="text-decoration: none" href="${PROGRAM_VIEW}">program</a> is completely hidden. (<a class="kae-white" href="${API_URL}?format=pretty">API</a>)`;
		} else if (response.status === 404) {
			msg.innerHTML = "This program is actually deleted.";
		}
	}).catch(console.error);
}

/*** Add a button to toggle the Editor Settings popup for programs ***/
async function addEditorSettingsButton (program: Program) {
	const editor = await querySelectorPromise(".scratchpad-ace-editor") as HTMLElement;

	const ace = window.ace;

	const extScriptEl = document.getElementById("ka-extension-script") as HTMLScriptElement;
	const extId = extScriptEl.src.split("/")[2];
	ace.config.set("basePath", `chrome-extension://${extId}/styles/ace-themes/`);

	if (!ace.require("ace/ext/language_tools")) {
		throw new Error("KA removed ace language tools.");
	} else {
		window.ScratchpadAutosuggest.enableLiveCompletion = function () {};
	}

	const innerButtonLink: HTMLButtonElement = document.createElement("button");
	innerButtonLink.id = EXTENSION_EDITOR_BUTTON;
	innerButtonLink.innerHTML = "Toggle Editor Settings";

	const session = ace.edit(editor).getSession();
	session.setMode(new (ace.require(session.getMode().$id).Mode)());

	const editorSettings = addEditorSettings(innerButtonLink, editor, program);

	function repos () {
		const pos = innerButtonLink.getBoundingClientRect();
		if (editorSettings) {
			editorSettings.style.left = pos.left + scrollX + "px";
			editorSettings.style.top = pos.top + scrollY - 10 + "px";
		} else {
			console.error("Could not load editorSettings");
		}
	}
	innerButtonLink.addEventListener("click", repos);
	window.addEventListener("resize", repos);

	const errorBuddy = await querySelectorPromise(".error-buddy-resting");
	const errorBuddyWrap = errorBuddy.parentNode as HTMLDivElement;
	if (!errorBuddyWrap) {
		throw new Error("Can't find Error Buddy");
	}
	errorBuddyWrap.parentNode!.insertBefore(innerButtonLink, errorBuddyWrap);

	if (editorSettings) {
		document.body.appendChild(editorSettings);
	}

	const editorWrap = document.querySelector(".scratchpad-editor-wrap");
	if (editorWrap && editorWrap.parentElement) {
		editorWrap.parentElement.classList.toggle("kae-hidden-editor-wrap", localStorage.kaeEditorHidden === "true" ? true : false);
	}else {
		throw new Error("Scratchpad editor has no parent wrap.");
	}
}

async function fixSavingScratchpadToLocalStorage (program: Program) {
	// exit if this isn't a new scratchpad
	if (typeof program.id === "number") {
		return;
	}

	// get the code editor
	const aceEditor = window.ace.edit(await querySelectorPromise(".scratchpad-ace-editor") as HTMLElement);
	if (!aceEditor) {
		return;
	}

	let userKaid = getKAID();
	if (!userKaid) {
		// sometimes getKAID returns null due to the extension running before Khan Academy finishes loading
		// solution: wait 100 milliseconds
		await wait(100);
		userKaid = getKAID();
	}

	const programType = program.userAuthoredContentType,
		localStorageKey = "ka:4:cs-scratchpad-new" + userKaid + "-" + programType;

	// get previous code and write it to the ace editor
	try {
		const storedJson = localStorage.getItem(localStorageKey) ?? "";
		const programFromStorage: CachedRevision = JSON.parse(storedJson);
		const code = programFromStorage.scratchpad.revision.code;
		if (code && code.length > 0) {
			aceEditor.setValue(code);
		}
	} catch (e) {
		console.log("Failed to load scratchpad from local storage");
	}

	function saveEditorCode () {
		let title = "New ";
		switch (programType) {
			case "pjs":
				title += "program";
				break;
			case "webpage":
				title += "webpage";
				break;
			case "sql":
				title += "SQL script";
				break;
		}

		// save user code to local storage
		localStorage.setItem(localStorageKey, JSON.stringify({
			"cursor": {
				"row": 0,
				"column": 0
			},
			"scratchpad": {
				"title": title,
				"translatedTitle": title,
				"category": null,
				"difficulty": null,
				"userAuthoredContentType": programType,
				"revision": {
					"code": aceEditor.getValue(),
					"created": new Date().toISOString()
				},
				"trustedRevision": {
					"created": new Date().toISOString()
				}
			}
		}));
	}

	// save code when the user exits the page
	window.addEventListener("beforeunload", saveEditorCode);

	// save code every minute (if browser fails to save the code when the page is unloaded, this will ensure that all is not lost)
	setInterval(saveEditorCode, TIME_PERIODS.minute);

	// delete the saved code from localStorage when it gets saved to KA
	document.body.addEventListener("mouseup", e => {
		if (e.target && (e.target as HTMLElement).textContent === "Save") {
			localStorage.removeItem(localStorageKey);
		}
	});
}

export { addProgramInfo, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted, fixSavingScratchpadToLocalStorage };
