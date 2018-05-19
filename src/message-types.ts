interface Message {
    type: MessageTypes,
    message: object
}

interface Downloadable {
    url: string
}

enum MessageTypes {
    DOWNLOAD = "download"
}

export { MessageTypes, Message, Downloadable };