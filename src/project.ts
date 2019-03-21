import { Program } from "./types/data";
import { KAdefine } from "./extension";
import { formatDate } from "./util/text-util";
import { PREFIX } from "./types/names";
import { querySelectorPromise } from "./util/promise-util";
import { addEditorSettings } from "./editor-settings";

function tableRow (key: string, val: string, title?: string): HTMLTableRowElement {
	const tr = document.createElement("tr");

	const keyElm: HTMLTableDataCellElement = <HTMLTableDataCellElement>document.createElement("td");
	keyElm.className = "kae-td";

	const valElm: HTMLTableDataCellElement = <HTMLTableCellElement>keyElm.cloneNode();
	keyElm.textContent = key;
	valElm.textContent = val;

	if (title) {
		valElm.title = title;
	}

	tr.appendChild(keyElm);
	tr.appendChild(valElm);

	return tr;
}

function addProgramAuthorHoverCard (program: Program): void {
	//TODO: Fix or remove
	KAdefine.asyncRequire("./javascript/hover-card-package/hover-card.js").then(HoverCard => {
		querySelectorPromise(".lastUpdated_9qi1wc").then((updatedSpan) => {
			const nicknameAnchor = (updatedSpan.parentNode as HTMLDivElement).getElementsByClassName("shared_ko2ejt-o_O-default_1bzye1z")[0];
			nicknameAnchor.addEventListener("mouseenter", function (this: HTMLAnchorElement) {
				HoverCard.createHoverCardQtip!(this, {
					my: "top left",
					at: "bottom left"
				});
			});
		});
	}).catch(console.error);
}

function addProgramInfo (program: Program, uok: string): void {
	querySelectorPromise(".lastUpdated_9qi1wc")
		.then(updatedSpan => updatedSpan as HTMLSpanElement)
		.then(updatedSpan => {
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
				const programShowAPI = "https://www.khanacademy.org/api/internal/show_scratchpad?projection={}&scratchpad_id=";

				fetch(programShowAPI + program.id).then((response: Response): void => {
					if (response.status === 404) {
						statusTd.innerHTML = "Completely";
						statusTd.style.color = "red";
					}
				}).catch(console.error);

				statusTd.style.color = "orange";
			} else if (approved) {
				statusTd.style.color = "green";
			}

			if (updated !== created) {
				table.appendChild(tableRow("Updated", updated));
			}
			table.appendChild(tableRow("Created", created));
			updatedSpan.appendChild(table);
		});
}

function hideEditor (program: Program): void {
	const wrap: HTMLDivElement | null = <HTMLDivElement>document.querySelector(".wrapScratchpad_1jkna7i");
	if (wrap) {
		const editor: HTMLDivElement = <HTMLDivElement>document.querySelector(".scratchpad-editor-wrap");
		const lsEditorId: string = `${PREFIX}editor-hide`;
		let lsEditorVal: string | null = <string>localStorage.getItem(lsEditorId);
		if (lsEditorVal && lsEditorVal === "true") {
			editor.classList.toggle("kae-hide");
			wrap.classList.toggle("kae-hide-wrap");
		}
		const rightArea = <HTMLDivElement>document.querySelector(".default_olfzxm-o_O-rightColumn_1rpl0kp");
		const hideButton = <HTMLAnchorElement>document.createElement("a");
		hideButton.id = "kae-hide-button";
		hideButton.classList.add("button_1eqj1ga-o_O-shared_1t8r4tr-o_O-default_9fm203-o_O-toolbarButton_em2kam");
		hideButton.textContent = "Toggle Editor";
		hideButton.addEventListener("click", (): void => {
			lsEditorVal = lsEditorVal === "true" ? "false" : "true";
			localStorage.setItem(lsEditorId, lsEditorVal);
			editor.classList.toggle("kae-hide");
			wrap.classList.toggle("kae-hide-wrap");
		});
		if (rightArea) {
			rightArea.appendChild(hideButton);
		}
	}
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
			case 68: // D - Toggle documentation
				const firstLink: HTMLAnchorElement | null = <HTMLAnchorElement>document.querySelector(".link_1uvuyao-o_O-tabTrigger_pbokdw-o_O-inactiveTab_1t8hj6j");
				if (firstLink) { firstLink.click(); }
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

	const PROGRAM_API = "https://www.khanacademy.org/api/internal/scratchpads";

	const textWrap = document.querySelector("#four-oh-four .textContainer_d4i2v")!;

	const msg = document.createElement("div");
	msg.style.marginTop = "25px";
	msg.innerHTML = "Checking program...";
	textWrap.appendChild(msg);
	fetch(`${PROGRAM_API}/${id}?projection={}`).then((response: Response): void => {
		if (response.status === 200) {
			msg.innerHTML = "This program actually exists.<br>";
			msg.innerHTML += `<a style="color: white" href="${PROGRAM_API}/${id}?format=pretty">View API Data</a>`;
		} else if (response.status === 404) {
			msg.innerHTML = "This program is actually deleted.";
		}
	}).catch(console.error);
}

/*** Add a button to toggle the Editor Settings popup for programs ***/
async function addEditorSettingsButton () {
	const leftArea = await querySelectorPromise(".default_olfzxm-o_O-leftColumn_qf2u39");

	const ace = (window as any).ace;

	ace.config.set("basePath", "https://cdn.jsdelivr.net/gh/ajaxorg/ace-builds@1.1.4/src-min-noconflict");

	if (!ace.require("ace/ext/language_tools")) {
		const scriptEl = document.createElement("script");
		scriptEl.setAttribute("src", "https://cdn.jsdelivr.net/gh/ajaxorg/ace-builds@1.1.4/src-min-noconflict/ext-language_tools.js");
		scriptEl.addEventListener("load", function () {
			ace.require("ace/ext/language_tools");
		});
		document!.head!.appendChild(scriptEl);
	}else {
		(window as any).ScratchpadAutosuggest.enableLiveCompletion = function () {};
	}

	const innerButtonLink: HTMLAnchorElement = document.createElement("a");
	innerButtonLink.id = "kae-toggle-editor-settings";
	innerButtonLink.classList.add("button_1eqj1ga-o_O-shared_1t8r4tr-o_O-default_9fm203-o_O-toolbarButton_em2kam");
	innerButtonLink.innerHTML = "Toggle Editor Settings";

	const editor = document.querySelector(".scratchpad-ace-editor") as HTMLElement;
	const session = ace.edit(editor).getSession();
	session.setMode(new (ace.require(session.getMode().$id).Mode)());

	const editorSettings = addEditorSettings(innerButtonLink, editor);

	function repos () {
		const pos = innerButtonLink.getBoundingClientRect();
		editorSettings.style.left = pos.left + pageXOffset + "px";
		editorSettings.style.top = pos.top + pageYOffset - 10 + "px";
	}
	innerButtonLink.addEventListener("click", repos);
	window.addEventListener("resize", repos);

	leftArea.appendChild(innerButtonLink);

	document.body.appendChild(editorSettings);
}

export { addProgramInfo, hideEditor, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted, addProgramAuthorHoverCard };
