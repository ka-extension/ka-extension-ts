// IIF isolates this code from everything else
(_=>{
    let aceEditor;
    
    let checkIfEditorIsReady = setInterval(function () {
        aceEditor = document.getElementsByClassName("scratchpad-ace-editor")[0]?.env?.editor;
        
        if (aceEditor !== undefined) {
            const programType = window.location.href.split("/")[5]; // get the type of the program either "pjs" or "webpage"
            
            // get previous code and write it to the ace editor
            const previousCode = localStorage.getItem("ka-new-program-" + programType);
            if (previousCode !== null && previousCode.length > 0) {
                aceEditor.setValue(previousCode);
            }
            
            
            function saveEditorCode () {
                localStorage.setItem("ka-new-program-" + programType, aceEditor.getValue()); // save user code to localStorage
            }
            
            window.addEventListener("beforeunload", saveEditorCode); // save code when the user exits the page
            
            // save code every minute (in case the browser fails to save code when the page is unloaded, this will ensure that all is not lost)
            setInterval(saveEditorCode, 1000 * 60);
            
            
            clearInterval(checkIfEditorIsReady); // we can stop checking if the editor is ready
        }
    }, 100);
})()
