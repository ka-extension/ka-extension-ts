import { Program } from "./types/data";
import { formatDate } from "./util/text-util";
import { PREFIX, DARK_THEME } from "./types/names";
import { querySelectorPromise } from "./util/promise-util";
import { BUTTON_CLASSES } from "./buttons";
import monokai from "../styles/ace-themes/monokai.css";
import textmate from "../styles/ace-themes/textmate.css";

const themes: { [key: string]: string } = {};

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
	querySelectorPromise(".lastUpdated_9qi1wc")
	.then(updatedSpan => updatedSpan as HTMLSpanElement)
	.then(updatedSpan => {
		const table = document.createElement("table");
		table.className = "kae-table";

		const updated: string = formatDate(program.date);
		const created: string = formatDate(program.created);
		const hidden: boolean = program.hideFromHotlist;
		const approved: boolean = program.definitelyNotSpam;

		if (program.kaid === uok){
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
		}else if (approved) {
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
			msg.innerHTML =  "This program actually exists.<br>";
			msg.innerHTML += `<a style="color: white" href="${PROGRAM_API}/${id}?format=pretty">View API Data</a>`;
		}else if (response.status === 404) {
			msg.innerHTML = "This program is actually deleted.";
		}
	}).catch(console.error);
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

export { addProgramInfo, hideEditor, keyboardShortcuts, darkToggleButton, checkHiddenOrDeleted };
