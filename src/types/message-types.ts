interface Message {
	type: MessageTypes;
	message?: object;
}

enum MessageTypes {
	COLOUR_ICON = "colour_icon",
	GREY_ICON = "grey_icon",
	KAID = "kaid",
}

export { MessageTypes, Message };
