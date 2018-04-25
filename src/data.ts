class InvalidUsernameOrKaid extends Error {
    constructor(uok: string) {
        super(`Invalid username or kaid "${uok}"`);
    }
}

enum IdType { USERNAME = "username", KAID = "kaid" };

class UsernameOrKaid {
    private readonly kaidPattern: RegExp = /kaid_\d{20,30}/;
    private readonly usernamePattern: RegExp = /[a-z][a-z0-9]{2,}/i;
    readonly id: string;
    readonly type: IdType;
    constructor(id: string) {
        if (this.kaidPattern.test(id))
            this.type = IdType.KAID;
        else if (this.usernamePattern.test(id))
            this.type = IdType.USERNAME;
        else
            throw new InvalidUsernameOrKaid(id);
        this.id = id;
    }
    toString(): string {
        return this.id;
    }
}

enum CommentSortType { TOP = 1, RECENT = 2 }

export { InvalidUsernameOrKaid, IdType, UsernameOrKaid, CommentSortType };
