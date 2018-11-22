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
	valueLabels?: string[];
	values?: boolean[] | boolean[][] | string[] | number[];
	label?: string;
}

class BoolRadio implements Option {
	valueLabels: string[];
	values: boolean[];

	constructor (values: { [valueLabel:string]: boolean }) {
		this.values = [];
		this.valueLabels = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class Select implements Option {
	label: string;
	valueLabels: string[];
	values: boolean[] | boolean[][] | string[] | number[];

	constructor (label: string) {
		this.label = label;

		this.valueLabels = [];
		this.values = [];
	}
}

//TODO: Make BoolSelect a checkbox?
class BoolSelect extends Select {
	values: boolean[];

	constructor (label: string, values: { [valueLabel:string]: boolean }) {
		super(label);

		this.values = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class TextSelect extends Select {
	values: string[];

	constructor (label: string, values: { [valueLabel:string]: string }) {
		super(label);

		this.values = [];
		for (const valueLabel in values) {
			this.values.push(values[valueLabel]);
			this.valueLabels.push(valueLabel);
		}
	}
}

class BoolSelectMultikey extends Select {
	values: boolean[][];

	constructor (label: string, values: { [valueLabel:string]: boolean[] }) {
		super(label);

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

	constructor (label: string, values: number[]) {
		super(label);

		this.values = values;
		this.valueLabels = values.map((n:number) => n.toString());
	}
}

class TextInput implements Option {
	label: string;
	placeholder: string;

	constructor (options: {label:string, placeholder:string}) {
		this.label = options.label;
		this.placeholder = options.placeholder;
	}
}

const POSSIBLE_OPTIONS:{ [key:string]: Option } = {
	wrap: new BoolRadio({
		"Wrap": true,
		"Scroll": false,
	}),
	useSoftTabs: new BoolRadio({
		"Spaces": true,
		"Tabs": false,
	}),
	tabSize: new NumSelect("Tab Width", [2, 4, 8]),
	showInvisibles: new BoolSelect("Show Invisibles", {
		"No": false,
		"Yes": true
	}),
	"enableBasicAutocompletion enableLiveAutocompletion": new BoolSelectMultikey(
		"Auto completion", {
			"Off": [false, false],
			"With ctrl+space": [true, false],
			"Live": [false, true]
		}),
	//Double ", (, {, etc. KA screws with this a bit, which is why we create a new edit mode
	//wrapBehaviours are when you select a word, then press " and it puts quotes around the word
	"behavioursEnabled wrapBehavioursEnabled": new BoolSelectMultikey(
		"Character pairs", {
			"Off" : [false, false],
			"Match Pair": [true, false],
			"Match Pair and Wrap Selection": [true, true],
		}),
	theme: new TextSelect("Theme", {
			"Textmate (Default)": "ace/theme/textmate",
			"Tomorrow": "ace/theme/tomorrow",
			"Tomorrow Night": "ace/theme/tomorrow_night",
			"Monokai (Dark)": "ace/theme/monokai"
		}),
	fontFamily: new TextInput({
		label: "Font",
		placeholder: "fontFamily css"
	}),
};

let editorSettingsCount = 0; //Used to give each instance an index, so that element id's don't conflict

function loadOptions () {
	try {
		return JSON.parse(window.localStorage.kaeEditorSettings);
	}catch (e) {
		return DEFAULT_SETTINGS;
	}
}

function addEditorSettings (toggleButton: HTMLElement, editor: HTMLElement) {
	const editorSettingsId = editorSettingsCount++;

	const aceEditor = (window as any).ace.edit(editor);
	const currentOptions = loadOptions();

	let toggledOn = false;
	const container = createContainer();

	function updateEditorSettings (this: HTMLInputElement) {
		const row = this.parentNode!.parentNode as HTMLElement;

		const option = row.dataset.kaeEditorOption!;

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

		window.localStorage.kaeEditorSettings = JSON.stringify(currentOptions);
	}

	function createContainer () {
		const container = document.createElement("div");
		container.classList.add("kae-editor-settings");
		const table = document.createElement("table");
		for (const option in POSSIBLE_OPTIONS) {
			if (!POSSIBLE_OPTIONS.hasOwnProperty(option)) { continue; }

			const optionObj = POSSIBLE_OPTIONS[option];
			const rowEl = document.createElement("tr");
			rowEl.dataset.kaeEditorOption = option;

			if (optionObj.label) {
				const tdEl = document.createElement("td");
				tdEl.innerHTML = optionObj.label;
				rowEl.appendChild(tdEl);

				if (optionObj instanceof Select) {
					const selectEl = document.createElement("select");
					selectEl.addEventListener("change", updateEditorSettings);
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
					inputEl.addEventListener("change", updateEditorSettings);
					rowEl.appendChild(document.createElement("td")).appendChild(inputEl);
				}
			}else if (optionObj instanceof BoolRadio){
				for (let i = 0; i < optionObj.values.length; i++) {
					const td = document.createElement("td");
					const labelEl = document.createElement("label");
					labelEl.innerHTML = optionObj.valueLabels[i];
					labelEl.setAttribute("for", `kae-es${editorSettingsId}-${optionObj.valueLabels[i].toLowerCase()}`);
					const inputEl = document.createElement("input");
					inputEl.value = optionObj.values[i].toString();
					inputEl.type = "radio";
					inputEl.id = `kae-es${editorSettingsId}-${optionObj.valueLabels[i].toLowerCase()}`;
					inputEl.name = `kae-es${editorSettingsId}-${option}`;
					if (currentOptions[option] === optionObj.values[i]) {
						inputEl.checked = true;
					}
					inputEl.addEventListener("change", updateEditorSettings);
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

export { addEditorSettings };
