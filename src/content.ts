(() => {
    console.log(`content.js fired`);

    const scriptTag: HTMLScriptElement = <HTMLScriptElement>document.createElement(`script`);
    const firstScriptTag: HTMLScriptElement = <HTMLScriptElement>document.getElementsByTagName(`script`)[0];
    scriptTag.src = chrome.extension.getURL(`./dist/index.js`);
    scriptTag.type = `text/javascript`;
    firstScriptTag!.parentNode!.insertBefore(scriptTag, firstScriptTag);

    const style: HTMLLinkElement = <HTMLLinkElement>document.createElement(`link`);
    style.rel = `stylesheet`;
    style.type = `text/css`;
    style.href = chrome.extension.getURL(`styles/general.css`);
    (document.head || document.documentElement).appendChild(style);
})();