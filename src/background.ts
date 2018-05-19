import { MessageTypes, Message } from "./message-types";
import { EXTENSION_ID } from "./names";

console.log(chrome.runtime.id == EXTENSION_ID);

chrome.runtime.onMessageExternal.addListener(function(arg: any, sender: chrome.runtime.MessageSender) {
    console.log("message", arg);
    arg = arg as Message;
    switch(arg.type) {
        case MessageTypes.DOWNLOAD:
            chrome.downloads.download(arg.message as chrome.downloads.DownloadOptions);
            break;
    }
});
