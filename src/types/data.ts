class InvalidUsernameOrKaid extends Error {
	constructor (uok: string) {
		super(`Invalid username or kaid "${uok}"`);
	}
}

enum IdType { USERNAME = "username", KAID = "kaid" }

class UsernameOrKaid {
	private readonly kaidPattern: RegExp = /kaid_\d{20,30}/;
	private readonly usernamePattern: RegExp = /[a-z][a-z0-9]{2,}/i;
	readonly id: string;
	readonly type: IdType;
	constructor (id: string) {
		if (this.kaidPattern.test(id)) {
			this.type = IdType.KAID;
		}
		else if (this.usernamePattern.test(id)) {
			this.type = IdType.USERNAME;
		}
		else {
			throw new InvalidUsernameOrKaid(id);
		}
		this.id = id;
	}
	toString (): string {
		return this.id;
	}
	asKaid (): string | null {
		return this.type === IdType.KAID ? this.toString() : null;
	}
	asUsername (): string | null {
		return this.type === IdType.KAID ? this.toString() : null;
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
	definitelyNotSpam: boolean;
	contentKind: string;
	type: string;
	flags: string[];
	url: string;
	sumVotesIncremented: number;
	key: string;
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

// Since there are different kinds of notifs, add in other props that are optional.
interface Notification {
	notes?: Notification[];
	iconSrc?: string;
	extendedDescription?: string;
	description?: string;
	authorAvatarName?: string;
	authorAvatarSrc?: string;
	authorNickname?: string;
	brandNew: boolean;
	class_: string[];
	content?: string;
	date: string;
	feedback?: string;
	feedbackHierarchy?: string[];
	feedbackIsComment?: boolean;
	feedbackIsPassingEvalAnswer?: boolean;
	feedbackIsProjectEvalAnswer?: boolean;
	feedbackIsProjectEvalRequest?: boolean;
	feedbackIsQuestion?: boolean;
	feedbackIsReply?: boolean;
	feedbackType?: string;
	focus?: string;
	focusTitle?: string;
	kaid?: string;
	kind: string;
	read: boolean;
	translatedFocusTitle?: string;
	translatedScratchpadTitle?: string;
	url: string;
	urlsafeKey: string;
	userId: string;
	modNickname?: string;
	text?: string;
	contentTitle?: string;
	coachName?: string;
	topicIconUrl?: string;
	imageSource?: string;
	missionName?: string;
	translatedDisplayName?: string;
	thumbnailSrc?: string;
}

interface Scratchpads {
	cursor?: string;
	scratchpads: Scratchpad[];
}

interface UserLocation {
	city: string;
	country: string;
	displayText: string;
	googlePlacesId: string;
	lastModified: string;
	postalCode: string;
	state: string;
}

interface UserProfileData {
	countBrandNewNotifications: number;
	isModerator?: boolean;
	dateJoined: string;
	kaid: string;
	userLocation: UserLocation;
	isPhantom: boolean;
}

interface KA {
	_userProfileData?: UserProfileData;
}

interface NotifObj {
	cursor: string;
	notifications: Notification[];
	has_more: boolean;
}


export {
	InvalidUsernameOrKaid, IdType, UsernameOrKaid,
	CommentSortType, Program, Notification,
	Scratchpads, KA, UserLocation, UserProfileData,
	NotifObj
};
