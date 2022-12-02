const CSRF_NAME: string = "fkey";
const CSRF_HEADER: string = `X-KA-${CSRF_NAME}`;
const COOKIE: string = "cookie";
const PREFIX: string = "ka-extension-";
const EXTENSION_COMMENT_CLASSNAME: string = PREFIX + "modified-comment";
const EXTENSION_ITEM_CLASSNAME: string = PREFIX + "modified-item";
const EXTENSION_MODIFIED_NOTIF: string = PREFIX + "-notif-delete";
const EXTENSION_EDITOR_BUTTON: string = "kae-toggle-editor-settings";
const EXTENSION_COMMENT_DARK = "kae-dark-theme";
const SVG_NAMESPACE: string = "http://www.w3.org/2000/svg";
const DELETE_BUTTON: string = "kae-notif-delete";
const API_ORIGIN: string = "https://www.khanacademy.org/api/internal";
const DEVELOPERS: string[] = [
	"kaid_933093676418892226040682",  // Luke
	"kaid_1063314115048600759228780", // Ethan
	"kaid_757721856896775939251306",  // Matthias
	"kaid_455920429074646065838008",  // Jett
];

const DATE_FORMATTER = typeof Intl.RelativeTimeFormat === "function"
	? new Intl.RelativeTimeFormat(navigator.language, { numeric: "auto", style: "long" })
	: undefined;

const TIME_PERIODS = {
	year: 24 * 60 * 60 * 1000 * 365,
	month: (24 * 60 * 60 * 1000 * 365) / 12,
	day: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	minute: 60 * 1000,
	second: 1000,
};

const NOTIF_TIMER_NAME = "kaeNotifTimer";

export {
	CSRF_NAME, CSRF_HEADER, COOKIE, NOTIF_TIMER_NAME,
	EXTENSION_COMMENT_CLASSNAME, EXTENSION_COMMENT_DARK,
	PREFIX, EXTENSION_ITEM_CLASSNAME, EXTENSION_MODIFIED_NOTIF,
	SVG_NAMESPACE, DELETE_BUTTON, API_ORIGIN, DEVELOPERS,
	DATE_FORMATTER, TIME_PERIODS, EXTENSION_EDITOR_BUTTON
};
