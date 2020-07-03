interface Message {
	type: MessageTypes;
	message?: KAID_MESSAGE;
}

const enum MessageTypes {
	COLOUR_ICON = "colour_icon",
	GREY_ICON = "grey_icon",
	KAID = "kaid",
}

interface KAID_MESSAGE {
	kaid: string;
}

export { MessageTypes, Message, KAID_MESSAGE };
