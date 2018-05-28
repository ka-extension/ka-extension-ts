interface Message {
    type: MessageTypes,
    message?: object
}

interface Downloadable {
    url: string
}

enum MessageTypes {
    DOWNLOAD = "download",
    ICON = "show_icon"
}

export { MessageTypes, Message, Downloadable };