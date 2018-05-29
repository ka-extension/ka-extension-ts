import { MessageTypes, Message } from "./types/message-types";
import { EXTENSION_ID } from "./types/names";

console.log(chrome.runtime.id == EXTENSION_ID);

chrome.runtime.onMessageExternal.addListener(function(arg: any, sender: chrome.runtime.MessageSender) {
    console.log("External Message: ", arg);
    arg = arg as Message;
    switch(arg.type) {
        case MessageTypes.DOWNLOAD:
            chrome.downloads.download(arg.message as chrome.downloads.DownloadOptions);
            break;
    }
});

let searchInterval: any;

chrome.runtime.onMessage.addListener((arg: any, sender: chrome.runtime.MessageSender) => {
    console.log("Internal Message: ", arg);
    arg = arg as Message;
    switch(arg.type) {
        case MessageTypes.ICON:
            chrome.browserAction.setIcon({
                path: "./images/colour/icon16.png"
            });
            searchInterval = setInterval(() => {
                chrome.tabs.query({
                    url: "*://*.khanacademy.org/*"
                }, tabs => {
                    if(tabs.length < 1){
                        chrome.browserAction.setIcon({
                            path: "./images/grey/icon16.png"
                        });
                        clearInterval(searchInterval);
                    }
                });
            }, 100);
            break;
    }
});
