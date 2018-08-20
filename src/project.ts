import { Program } from "./types/data";
import { formatDate } from "./util/text-util";
import { PREFIX } from "./types/names";

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

function addProgramDates (program: Program, uok: string): void {
	const profilePrograms: HTMLAnchorElement | null = <HTMLAnchorElement> document.querySelector(".profile-programs");
	if (profilePrograms && profilePrograms.nextElementSibling) {
		const updatedSpan: HTMLSpanElement = <HTMLSpanElement> profilePrograms.nextElementSibling;
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
		hideButton.className = "link_1uvuyao-o_O-computing_1w8n1i8";
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

export { addProgramDates, hideEditor, keyboardShortcuts };
