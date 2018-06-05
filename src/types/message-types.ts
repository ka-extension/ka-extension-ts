interface Message {
	type: MessageTypes;
	message?: object;
}

interface Downloadable {
	url: string;
}

enum MessageTypes {
	DOWNLOAD = "download",
	COLOUR_ICON = "colour_icon",
	GREY_ICON = "grey_icon"
}

export { MessageTypes, Message, Downloadable };
