const initSpade = (function () {

var DEFAULT_SETTINGS = {
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
    showInvisibles: false,
    tabSize: 4,
    theme: "ace/theme/textmate",
    useSoftTabs: true,
    wrap: true,
    useWorker: false,
    behavioursEnabled: true,
    wrapBehavioursEnabled: false,
};

var POSSIBLE_OPTIONS = {
    wrap: {
        "Wrap": true,
        "Scroll": false
    },
    useSoftTabs: {
        "Tabs": false,
        "Spaces": true
    },
    tabSize: {
        label: "Tab Width",
        values: [2, 4, 8],
        type: "NUM_SELECT",
    },
    //TODO: Make BOOL_SELECT a checkbox?
    showInvisibles: {
        label: "Show Invisibles",
        type: "BOOL_SELECT",
        values: {
            "No": false,
            "Yes" : true
        }
    },

    "enableBasicAutocompletion enableLiveAutocompletion": {
        label: "Auto completion",
        type: "BOOL_SELECT_MULTIKEY",
        values: {
            "Off" : [false, false],
            "With ctrl+space": [true, false],
            "Live": [false , true],
        }
    },
    //Double ", (, {, etc. KA screws with this a bit, which is why we create a new edit mode
    //wrapBehaviours are when you select a word, then press " and it puts quotes around the word
    "behavioursEnabled wrapBehavioursEnabled": {
        label: "Character pairs",
        type: "BOOL_SELECT_MULTIKEY",
        values: {
            "Off" : [false, false],
            "Match Pair": [true, false],
            "Match Pair and Wrap Selection": [true, true],
        },
    },

    theme: {
        label: "Theme",
        values: {
            "Textmate (Default)": "ace/theme/textmate",
            "Tomorrow": "ace/theme/tomorrow",
            "Tomorrow Night": "ace/theme/tomorrow_night",
            "Monokai (Dark)": "ace/theme/monokai"
        },
    },
    fontFamily: {
        label: "Font",
        type: "TEXT_INPUT",
        placeholder: "fontFamily css"
    },
};

var spadeCount = 0; //Used to give each instance an index, so that element id's don't conflict

function parseValue (type, value) {
    switch (type) {
        case "BOOL_SELECT":
            return value === "true";
        case "NUM_SELECT":
            return parseFloat(value, 10);
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

return function (toggleButton, editor) {
    var spadeIndex = spadeCount++;

    editor = ace.edit(editor);
    var currentOptions = loadOptions();

    var toggledOn = false;
    var container = createContainer();

    function spadeUpdate () {
        var row = this.parentNode.parentNode;

        var option = row.dataset.spadeOption;

        var type = this.dataset.spadeType;

        if (type === "BOOL_SELECT_MULTIKEY") {
            var values = this.value.split(" ");
            var options = option.split(" ");

            for (var i = 0; i < values.length; i++) {
                editor.setOption(options[i], values[i] === "true");

                currentOptions[options[i]] = values[i] === "true";
            }
        }else {
            var value = parseValue(type, this.value);

            editor.setOption(option, value);

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

            var optionObj = POSSIBLE_OPTIONS[option]
            var rowEl = document.createElement("tr");
            rowEl.dataset.spadeOption = option;

            if (optionObj.label) {
                var tdEl = document.createElement("td");
                tdEl.innerHTML = optionObj.label;
                rowEl.appendChild(tdEl);

                if (optionObj.values) {
                    var selectEl = document.createElement("select");
                    selectEl.dataset.spadeType = optionObj.type || "TEXT_SELECT";
                    selectEl.addEventListener("change", spadeUpdate);
                    var selectedIndex;
                    if (optionObj.values instanceof Array) {
                        for (var i = 0; i < optionObj.values.length; i++) {
                            var optionEl = document.createElement("option");
                            optionEl.value = optionObj.values[i];
                            optionEl.innerHTML = optionObj.values[i];
                            if (currentOptions[option] === optionObj.values[i]) {
                                selectedIndex = i;
                            }
                            selectEl.appendChild(optionEl);
                        }
                    }else if (typeof optionObj.values === "object") {
                        for (var key in optionObj.values) {
                            if (!optionObj.values.hasOwnProperty(key)) continue;

                            var optionEl = document.createElement("option");
                            optionEl.innerHTML = key;

                            if (optionObj.values[key] instanceof Array) {
                                //Then we're looking at a BOOL_SELECT_MULTIKEY
                                optionEl.value = optionObj.values[key].join(" ");

                                //This reduce handles checking if the current values for the ace options controlled by the multiselect
                                //  match the values for the current possible value for the multiselect
                                if (option.split(" ").reduce((acc, k, i) => acc && currentOptions[k] === optionObj.values[key][i], true)) {
                                    selectedIndex = selectEl.childElementCount;
                                }
                            }else {
                                optionEl.value = optionObj.values[key];
                                if (currentOptions[option] === optionObj.values[key]) {
                                    selectedIndex = selectEl.childElementCount;
                                }
                            }

                            selectEl.appendChild(optionEl);
                        }
                    }
                    selectEl.selectedIndex = selectedIndex;
                    rowEl.appendChild(document.createElement("td")).appendChild(selectEl);
                }else if (optionObj.type === "TEXT_INPUT"){
                    var inputEl = document.createElement("input");
                    inputEl.type = "text";
                    inputEl.placeholder = optionObj.placeholder;
                    inputEl.value = currentOptions[option];
                    inputEl.addEventListener("change", spadeUpdate);
                    rowEl.appendChild(document.createElement("td")).appendChild(inputEl);
                }
            }else {
                for (var key in optionObj) {
                    if (!optionObj.hasOwnProperty(key)) continue;

                    var td = document.createElement("td");
                    var labelEl = document.createElement("label");
                    labelEl.innerHTML = key;
                    labelEl.setAttribute("for", "spade-" + spadeIndex + "-" + key.toLowerCase());
                    var inputEl = document.createElement("input");
                    inputEl.value = optionObj[key];
                    inputEl.type = "radio";
                    inputEl.id = "spade-" + spadeIndex + "-" + key.toLowerCase();
                    inputEl.dataset.spadeType = "BOOL_SELECT";
                    inputEl.name = "spade-" + spadeIndex + "-" + option;
                    if (currentOptions[option] === optionObj[key]) {
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

    var mode = editor.getSession().getMode().$id;
    editor.getSession().setMode(new (ace.require(mode).Mode)())

    editor.setOptions(currentOptions);

    return container;
};

})();

export { initSpade }
