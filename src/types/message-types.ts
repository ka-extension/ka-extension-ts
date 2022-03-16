interface Message {
	type: MessageTypes;
	message?: KAID_MESSAGE;
}

const enum MessageTypes {
	COLOUR_ICON = "colour_icon",
	GREY_ICON = "grey_icon",
	PAGE_UPDATE = "page_update",
}

interface KAID_MESSAGE {
	kaid: string;
}

export { MessageTypes, Message, KAID_MESSAGE };
