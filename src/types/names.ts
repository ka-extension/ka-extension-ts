const CSRF_NAME: string = "fkey";
const CSRF_HEADER: string = `X-KA-${CSRF_NAME}`;
const COOKIE: string = "cookie";
const EXTENSION_COMMENT_CLASSNAME: string = "ka-extension-modified-comment";
const EXTENSION_ITEM_CLASSNAME: string = "ka-extension-modified-item";
const EXTENSION_MODIFIED_NOTIF: string = "ka-extension-notif-delete";
const PREFIX: string = "ka-extension-";
const SVG_NAMESPACE: string = "http://www.w3.org/2000/svg";
const DELETE_BUTTON: string = "kae-notif-delete";
const API_ORIGIN: string = "https://www.khanacademy.org/api/internal";
const DEVELOPERS: string[] = [
	"kaid_933093676418892226040682",  // Luke
	"kaid_1063314115048600759228780", // Ethan
	"kaid_757721856896775939251306",  // Matthias
	"kaid_455920429074646065838008",  // Jett
];

export {
	CSRF_NAME, CSRF_HEADER, COOKIE,
	EXTENSION_COMMENT_CLASSNAME,
	PREFIX, EXTENSION_ITEM_CLASSNAME, EXTENSION_MODIFIED_NOTIF,
	SVG_NAMESPACE, DELETE_BUTTON, API_ORIGIN, DEVELOPERS
};
