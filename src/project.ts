import { Program } from "./types/data";
import { KAdefine } from "./extension";
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

function addProgramAuthorHoverCard (program: Program): void {
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
	});
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

		table.appendChild(tableRow("Hidden from Hotlist", hidden ? "Yes" : "No"));
		table.appendChild(tableRow("Guardian Approved", approved ? "Yes" : "No"));
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

export { addProgramInfo, hideEditor, keyboardShortcuts, darkToggleButton, addProgramAuthorHoverCard };
