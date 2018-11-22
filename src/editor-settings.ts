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

    constructor(key: string, values: { [valueLabel:string]: boolean }) {
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
    values: boolean[] | string[];

    constructor(key:string, label: string, values: { [valueLabel:string]: boolean|string }) {
        this.key = key;
        this.label = label;

        this.valueLabels = [];
        this.values = [];
    }
}

//TODO: Make BoolSelect a checkbox?
class BoolSelect extends Select {
    values: boolean[];

    constructor(key:string, label: string, values: { [valueLabel:string]: boolean }) {
        super(key, label, values);

        this.values = [];
        this.valueLabels = [];
        for (const valueLabel in values) {
            this.values.push(values[valueLabel]);
            this.valueLabels.push(valueLabel);
        }
    }
}

class TextSelect extends Select {
    values: string[];

    constructor(key:string, label: string, values: { [valueLabel:string]: string }) {
        super(key, label, values);

        this.values = [];
        this.valueLabels = [];
        for (const valueLabel in values) {
            this.values.push(values[valueLabel]);
            this.valueLabels.push(valueLabel);
        }
    }
}

class BoolSelectMultikey implements Option {
    key: string[];
    label: string;
    valueLabels: string[];
    values: boolean[][];

    constructor(key:string[], label: string, values: { [valueLabel:string]: boolean[] }) {
        this.key = key;
        this.label = label;

        this.values = [];
        this.valueLabels = [];
        for (const valueLabel in values) {
            this.values.push(values[valueLabel]);
            this.valueLabels.push(valueLabel);
        }
    }
}



class NumSelect implements Option {
    key: string;
    label: string;
    valueLabels:string[];
    values: number[];

    constructor(key:string, label: string, values: number[]) {
        this.key = key;
        this.label = label;
        this.values = values;
        this.valueLabels = values.map((n:number) => n.toString());
    }
}

class TextInput implements Option {
    key: string;
    label: string;
    placeholder: string;

    constructor(key:string, options: {label:string, placeholder:string}) {
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

var spadeCount = 0; //Used to give each instance an index, so that element id's don't conflict

function parseValue (type: string, value: string) {
    switch (type) {
        case "BOOL_SELECT":
            return value === "true";
        case "NUM_SELECT":
            return parseFloat(value);
    }
    return value;
}

function loadOptions () {
    try {
        return JSON.parse(window.localStorage.spadeOptions);
    }catch (e) {
        return DEFAULT_SETTINGS;
    }
}

var s = document.createElement("style");
s.innerHTML = "\
.spade-container {\
    display: block;\
    position: absolute;\
    border: 2px solid #D6D8DA;\
    color: black;\
    transform: translateY(-100%);\
    text-align: left;\
    border-radius: 2px;\
    padding: 5px;\
    background: #fff;\
}\
.spade-container table {\
    border-collapse: separate;\
    border-spacing: 5px;\
}\
.spade-container:before {\
    border-top-color: transparent;\
    background: #fff;\
    padding: 8px;\
    content: \"\";\
    position: absolute;\
    top: 100%;\
    border-radius: 2px;\
    border: 2px solid #D6D8DA;\
    border-top-color: transparent;\
    border-top-left-radius: 0;\
    border-top-right-radius: 0;\
}";
document.head.appendChild(s);

function initSpade (toggleButton: HTMLElement, editor: HTMLElement) {
    const spadeIndex = spadeCount++;

    const aceEditor = (window as any).ace.edit(editor);
    const currentOptions = loadOptions();

    let toggledOn = false;
    const container = createContainer();

    function spadeUpdate (this: HTMLInputElement) {
        const row = this.parentNode!.parentNode as HTMLElement;

        var option = row.dataset.spadeOption!;

        var type = this.dataset.spadeType;

        if (type === "BOOL_SELECT_MULTIKEY") {
            var values = this.value.split(" ");
            var options = option.split(" ");

            for (var i = 0; i < values.length; i++) {
                aceEditor.setOption(options[i], values[i] === "true");

                currentOptions[options[i]] = values[i] === "true";
            }
        }else {
            var value = parseValue(type!, this.value);

            aceEditor.setOption(option, value);

            currentOptions[option] = value;
        }

        window.localStorage.spadeOptions = JSON.stringify(currentOptions);
    }

    function createContainer () {
        var container = document.createElement("div");
        container.classList.add("spade-container");
        var table = document.createElement("table");
        for (var option in POSSIBLE_OPTIONS) {
            if (!POSSIBLE_OPTIONS.hasOwnProperty(option)) continue;

            const optionObj = POSSIBLE_OPTIONS[option];
            var rowEl = document.createElement("tr");
            rowEl.dataset.spadeOption = option;

            if (optionObj.label) {
                var tdEl = document.createElement("td");
                tdEl.innerHTML = optionObj.label;
                rowEl.appendChild(tdEl);

                if (optionObj instanceof Select) {
                    var selectEl = document.createElement("select");
                    // selectEl.dataset.spadeType = optionObj.type || "TEXT_SELECT";
                    selectEl.addEventListener("change", spadeUpdate);
                    let selectedIndex: number;
                    if (optionObj instanceof NumSelect) {
                        for (var i = 0; i < optionObj.values.length; i++) {
                            var optionEl = document.createElement("option");
                            optionEl.value = optionObj.values[i].toString();
                            optionEl.innerHTML = optionObj.valueLabels[i];
                            if (currentOptions[option] === optionObj.values[i]) {
                                selectedIndex = i;
                            }
                            selectEl.appendChild(optionEl);
                        }
                    }else if (optionObj instanceof BoolSelectMultikey) {
                        for (var i = 0; i < optionObj.values.length; i++) {
                            var optionEl = document.createElement("option");
                            optionEl.innerHTML = optionObj.valueLabels[i];

                            optionEl.value = optionObj.key.join(" ");

                            //This reduce handles checking if the current values for the ace options controlled by the multiselect
                            //  match the values for the current possible value for the multiselect
                            if (option.split(" ").reduce((acc, k, j) => acc && currentOptions[k] === optionObj.values[i][j], true)) {
                                selectedIndex = selectEl.childElementCount;
                            }

                            selectEl.appendChild(optionEl);
                        }
                    }else if (optionObj instanceof BoolSelect || optionObj instanceof TextSelect) {
                        for (var i = 0; i < optionObj.values.length; i++) {
                            var optionEl = document.createElement("option");
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
                    var inputEl = document.createElement("input");
                    inputEl.type = "text";
                    inputEl.placeholder = optionObj.placeholder;
                    inputEl.value = currentOptions[option];
                    inputEl.addEventListener("change", spadeUpdate);
                    rowEl.appendChild(document.createElement("td")).appendChild(inputEl);
                }
            }else if (optionObj instanceof BoolRadio){
                for (var i = 0; i < optionObj.values.length; i++) {
                    var td = document.createElement("td");
                    var labelEl = document.createElement("label");
                    labelEl.innerHTML = optionObj.valueLabels[i];
                    labelEl.setAttribute("for", "spade-" + spadeIndex + "-" + optionObj.valueLabels[i].toLowerCase());
                    var inputEl = document.createElement("input");
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

    var mode = aceEditor.getSession().getMode().$id;
    aceEditor.getSession().setMode(new ((window as any).ace.require(mode).Mode)())

    aceEditor.setOptions(currentOptions);

    return container;
};

export { initSpade }
