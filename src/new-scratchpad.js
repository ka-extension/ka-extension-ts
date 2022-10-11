// IIF isolates this code from everything else
(_=>{
    let aceEditor;
    
    let checkIfEditorIsReadyInterval = setInterval(function () {
        aceEditor = document.getElementsByClassName("scratchpad-ace-editor")[0]?.env?.editor;
        
        if (aceEditor !== undefined) {
            const programType = window.location.href.split("/")[5]; // get the type of the program either "pjs" or "webpage"
            
            // get previous code and write it to the ace editor
            const previousCode = localStorage.getItem("ka-new-program-" + programType);
            if (previousCode !== null && previousCode.length > 0) {
                aceEditor.setValue(previousCode);
            }
            
            
            // save user code to local storage
            function saveEditorCode () {
                localStorage.setItem("ka-new-program-" + programType, aceEditor.getValue());
            }
            window.addEventListener("beforeunload", saveEditorCode); // save code when the user exits the page
            // save code every minute (in case the browser fails to save code when the page is unloaded, this will ensure that all is not lost)
            setInterval(saveEditorCode, 1000 * 60);
            
            
            // delete the saved code from localStorage when it gets saved to KA
            document.body.addEventListener("mouseup", function (e) {
                if (e.toElement.className === "_4w4gmuz") {
                    localStorage.setItem("ka-new-program-" + programType, "");
                }
            });
            
            
            clearInterval(checkIfEditorIsReadyInterval); // we can stop checking if the editor is ready
        }
    }, 100);
})()
