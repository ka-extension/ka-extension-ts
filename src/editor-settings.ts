const DEFAULT_SETTINGS = {
	fontFamily : "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
	showInvisibles : false,
	tabSize : 4,
	theme : "ace/theme/textmate",
	useSoftTabs : true,
	wrap : true,
	useWorker : false,
	behavioursEnabled : true,
	wrapBehavioursEnabled : false,
};

interface Option {
	key: string | string[];
	valueLabels?: string[];
	values?: boolean[] | boolean[][] | string[] | number[];
	label?: string;
}

class BoolRadio implements Option {
	key: string;
	valueLabels: string[];
	values: boolean[];

	constructor (key: string, values: { [valueLabel:string]: boolean }) {
		this.key = key;

		this.values = [];
		this.valueLabels = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class Select implements Option {
	key: string;
	label: string;
	valueLabels: string[];
	values: boolean[] | boolean[][] | string[] | number[];

	constructor (key:string, label: string) {
		this.key = key;
		this.label = label;

		this.valueLabels = [];
		this.values = [];
	}
}

//TODO: Make BoolSelect a checkbox?
class BoolSelect extends Select {
	values: boolean[];

	constructor (key:string, label: string, values: { [valueLabel:string]: boolean }) {
		super(key, label);

		this.values = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class TextSelect extends Select {
	values: string[];

	constructor (key:string, label: string, values: { [valueLabel:string]: string }) {
		super(key, label);

		this.values = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class BoolSelectMultikey extends Select {
	values: boolean[][];

	constructor (key:string[], label: string, values: { [valueLabel:string]: boolean[] }) {
		super(key.join(" "), label);

		this.values = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class NumSelect extends Select {
	valueLabels:string[];
	values: number[];

	constructor (key:string, label: string, values: number[]) {
		super(key, label);

		this.values = values;
		this.valueLabels = values.map((n:number) => n.toString());
	}
}

class TextInput implements Option {
	key: string;
	label: string;
	placeholder: string;

	constructor (key:string, options: {label:string, placeholder:string}) {
		this.key = key;
		this.label = options.label;
		this.placeholder = options.placeholder;
	}
}

const POSSIBLE_OPTIONS:{ [key:string]: Option } = {
	wrap: new BoolRadio("wrap", {
		"Wrap": true,
		"Scroll": false,
	}),
	useSoftTabs: new BoolRadio("useSoftTabs", {
		"Spaces": true,
		"Tabs": false,
	}),
	tabSize: new NumSelect("tabSize", "Tab Width", [2, 4, 8]),
	showInvisibles: new BoolSelect("showInvisibles", "Show Invisibles", {
		"No": false,
		"Yes": true
	}),
	"enableBasicAutocompletion enableLiveAutocompletion": new BoolSelectMultikey(["enableBasicAutocompletion", "enableLiveAutocompletion"],
		"Auto completion", {
			"Off": [false, false],
			"With ctrl+space": [true, false],
			"Live": [false, true]
		}),
	//Double ", (, {, etc. KA screws with this a bit, which is why we create a new edit mode
	//wrapBehaviours are when you select a word, then press " and it puts quotes around the word
	"behavioursEnabled wrapBehavioursEnabled": new BoolSelectMultikey(["behavioursEnabled", "wrapBehavioursEnabled"],
		"Character pairs", {
			"Off" : [false, false],
			"Match Pair": [true, false],
			"Match Pair and Wrap Selection": [true, true],
		}),
	theme: new TextSelect("theme", "Theme", {
			"Textmate (Default)": "ace/theme/textmate",
			"Tomorrow": "ace/theme/tomorrow",
			"Tomorrow Night": "ace/theme/tomorrow_night",
			"Monokai (Dark)": "ace/theme/monokai"
		}),
	fontFamily: new TextInput("fontFamily", {
		label: "Font",
		placeholder: "fontFamily css"
	}),
};

let spadeCount = 0; //Used to give each instance an index, so that element id's don't conflict

function loadOptions () {
	try {
		return JSON.parse(window.localStorage.spadeOptions);
	}catch (e) {
		return DEFAULT_SETTINGS;
	}
}

function initSpade (toggleButton: HTMLElement, editor: HTMLElement) {
	const spadeIndex = spadeCount++;

	const aceEditor = (window as any).ace.edit(editor);
	const currentOptions = loadOptions();

	let toggledOn = false;
	const container = createContainer();

	function spadeUpdate (this: HTMLInputElement) {
		const row = this.parentNode!.parentNode as HTMLElement;

		const option = row.dataset.spadeOption!;

		const optionObj = POSSIBLE_OPTIONS[option];

		if (optionObj instanceof BoolSelectMultikey) {
			const values = this.value.split(" ");
			const options = option.split(" ");

			for (let i = 0; i < values.length; i++) {
				aceEditor.setOption(options[i], values[i] === "true");

				currentOptions[options[i]] = values[i] === "true";
			}
		}else {
			let value:number|string|boolean = this.value;
			if (optionObj instanceof NumSelect) {
				value = parseFloat(value);
			}else if (optionObj instanceof BoolSelect || optionObj instanceof BoolRadio) {
				value = value === "true";
			}

			aceEditor.setOption(option, value);

			currentOptions[option] = value;
		}

		window.localStorage.spadeOptions = JSON.stringify(currentOptions);
	}

	function createContainer () {
		const container = document.createElement("div");
		container.classList.add("kae-editor-settings");
		const table = document.createElement("table");
		for (const option in POSSIBLE_OPTIONS) {
			if (!POSSIBLE_OPTIONS.hasOwnProperty(option)) { continue; }

			const optionObj = POSSIBLE_OPTIONS[option];
			const rowEl = document.createElement("tr");
			rowEl.dataset.spadeOption = option;

			if (optionObj.label) {
				const tdEl = document.createElement("td");
				tdEl.innerHTML = optionObj.label;
				rowEl.appendChild(tdEl);

				if (optionObj instanceof Select) {
					const selectEl = document.createElement("select");
					// selectEl.dataset.spadeType = optionObj.type || "TEXT_SELECT";
					selectEl.addEventListener("change", spadeUpdate);
					let selectedIndex: number;

					if (optionObj instanceof NumSelect) {
						for (let i = 0; i < optionObj.values.length; i++) {
							const optionEl = document.createElement("option");
							optionEl.value = optionObj.values[i].toString();
							optionEl.innerHTML = optionObj.valueLabels[i];
							if (currentOptions[option] === optionObj.values[i]) {
								selectedIndex = i;
							}
							selectEl.appendChild(optionEl);
						}
					}else if (optionObj instanceof BoolSelectMultikey) {
						for (let i = 0; i < optionObj.values.length; i++) {
							const optionEl = document.createElement("option");
							optionEl.innerHTML = optionObj.valueLabels[i];

							optionEl.value = optionObj.values[i].join(" ");

							//This reduce handles checking if the current values for the ace options controlled by the multiselect
							//  match the values for the current possible value for the multiselect
							if (option.split(" ").reduce((acc, k, j) => acc && currentOptions[k] === optionObj.values[i][j], true)) {
								selectedIndex = selectEl.childElementCount;
							}

							selectEl.appendChild(optionEl);
						}
					}else if (optionObj instanceof BoolSelect || optionObj instanceof TextSelect) {
						for (let i = 0; i < optionObj.values.length; i++) {
							const optionEl = document.createElement("option");
							optionEl.innerHTML = optionObj.valueLabels[i];

							optionEl.value = optionObj.values[i].toString();
							if (currentOptions[option] === optionObj.values[i]) {
								selectedIndex = selectEl.childElementCount;
							}

							selectEl.appendChild(optionEl);
						}
					}
					selectEl.selectedIndex = selectedIndex!;
					rowEl.appendChild(document.createElement("td")).appendChild(selectEl);
				}else if (optionObj instanceof TextInput){
					const inputEl = document.createElement("input");
					inputEl.type = "text";
					inputEl.placeholder = optionObj.placeholder;
					inputEl.value = currentOptions[option];
					inputEl.addEventListener("change", spadeUpdate);
					rowEl.appendChild(document.createElement("td")).appendChild(inputEl);
				}
			}else if (optionObj instanceof BoolRadio){
				for (let i = 0; i < optionObj.values.length; i++) {
					const td = document.createElement("td");
					const labelEl = document.createElement("label");
					labelEl.innerHTML = optionObj.valueLabels[i];
					labelEl.setAttribute("for", "spade-" + spadeIndex + "-" + optionObj.valueLabels[i].toLowerCase());
					const inputEl = document.createElement("input");
					inputEl.value = optionObj.values[i].toString();
					inputEl.type = "radio";
					inputEl.id = "spade-" + spadeIndex + "-" + optionObj.valueLabels[i].toLowerCase();
					inputEl.dataset.spadeType = "BOOL_SELECT";
					inputEl.name = "spade-" + spadeIndex + "-" + option;
					if (currentOptions[option] === optionObj.values[i]) {
						inputEl.checked = true;
					}
					inputEl.addEventListener("change", spadeUpdate);
					td.appendChild(inputEl);
					rowEl.appendChild(td).appendChild(labelEl);
				}
			}

			container.appendChild(table).appendChild(rowEl);
		}
		return container;
	}

	container.style.display = "none";

	toggleButton.addEventListener("click", function () {
		toggledOn = !toggledOn;
		if (toggledOn) {
			container.style.display = "block";
		}else {
			container.style.display = "none";
		}
	});

	const mode = aceEditor.getSession().getMode().$id;
	aceEditor.getSession().setMode(new ((window as any).ace.require(mode).Mode)());

	aceEditor.setOptions(currentOptions);

	return container;
}

export { initSpade };
