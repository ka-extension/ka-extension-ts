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

interface Program {
    contentKindCode: string;
    newUrlPath: string;
    hideFromHotlist: boolean;
    relativeUrl: string;
    originScratchpadId?: number;
    forkedFromTopic: string;
    projectEval?: string;
    height: number;
    date: string;
    created: string;
    originSimilarity: number;
    id: number;
    contentKind: string;
    type: string;
    flags: string[];
    url: string;
    sumVotesIncremented: number;
    isProject: boolean;
    isProjectOrFork: boolean;
    kaid: string;
    imageUrl: string;
    width: number;
    userAuthoredContentType: string;
}

interface Scratchpad {
    thumb: string;
    created: string;
    authorKaid: string;
    title: string;
    sumVotesIncremented: number;
    flaggedByUser: boolean;
    url: string;
    key: string;
    authorNickname: string;
    spinoffCount: number;
    translatedTitle: string;
}

interface Scratchpads {
    cursor?: string;
    scratchpads: Scratchpad[];
}

interface UserProfileData {
  isModerator?: boolean;
  dateJoined: string;
  kaid: string;
}

interface KA {
  _userProfileData?: UserProfileData
}

export { InvalidUsernameOrKaid, IdType, UsernameOrKaid, CommentSortType, Program, Scratchpads, KA, UserProfileData };
