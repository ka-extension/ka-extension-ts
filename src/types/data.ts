class InvalidUsernameOrKaid extends Error {
	constructor (uok: string) {
		super(`Invalid username or kaid "${uok}"`);
	}
}

enum IdType { USERNAME = "username", KAID = "kaid", ME = "me" }

class UsernameOrKaid {
	private readonly kaidPattern: RegExp = /kaid_\d{20,30}/;
	private readonly usernamePattern: RegExp = /[a-z][a-z0-9]{2,}/i;

	readonly id: string;
	readonly type: IdType;

	constructor (id: string) {
		if (id === "me" || id === "") {
			this.type = IdType.ME;
		} else if (this.kaidPattern.test(id)) {
			this.type = IdType.KAID;
		} else if (this.usernamePattern.test(id)) {
			this.type = IdType.USERNAME;
		} else {
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
		return this.type === IdType.USERNAME ? this.toString() : null;
	}
	isMe (): boolean {
		return this.type === IdType.ME;
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

interface OldScratchpad {
	scratchpad: Program;
	creatorProfile: {
		backgroundSrc: string;
	};
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
/*interface Notification {
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
	name?: string;
	read: boolean;
	translatedFocusTitle?: string;
	translatedScratchpadTitle?: string;
	url?: string;
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
	translatedRequirements?: string[];
	thumbnailSrc?: string;
}*/

interface Scratchpads {
	cursor?: string;
	scratchpads: Scratchpad[];
}

interface UserProfileData {
	newNotificationCount?: number;
	countVideosCompleted: number;
	isModerator?: boolean;
	joined: string;
	kaid: string;
	isPhantom: boolean;
	username: string;
}

interface User {
	discussion_banned?: boolean;
}

interface Notification {
	"__typename": string;
	brandNew: boolean;
	date: string; // "2022-08-19T16:24:00.66185Z",
	kaid: string;
	read: boolean;
	url: string;
	urlsafeKey: string;
	class_: string[]; /*[
						"BaseNotification",
						"ReadableNotification",
						"BaseFeedbackNotification",
						"ScratchpadFeedbackNotification"
						],*/

	// AssignmentCreatedNotificationType
	numAssignments?: number;
	contentTitle?: string;
	curationNodeIconURL?: string;
	className?: string;

	// AssignmentDueDateNotificationType
	//numAssignments?: number,
	dueDate?: string;
	//contentTitle?: string,
	//curationNodeIconURL?: string,

	// AvatarNotificationDeprecatedType
	translatedCategoryTitle?: string;
	pointsRequired?: number;

	// AvatarNotificationType
	name?: string;
	thumbnailSrc?: string;


	// BadgeNotificationType
	badgeName?: string;
	badge?: BadgeNotif;

	// CoachRequestAcceptedNotificationType
	isMultipleClassrooms?: boolean;
	student?: {
		id: string,
		email: string,
		nickname: string
	};
	classroom?: {
		cacheId: string,
		id: string,
		name: string,
		topics: {
			id: string,
			slug: string,
			iconUrl: string,
			key: string,
			translatedStandaloneTitle: string,
		}
	};

	// CoachRequestNotificationType
	coachIsParent?: boolean;
	coach?: {
		id: string,
		kaid: string,
		nickname: string,
	};

	// CourseMasteryGoalCreatedNotificationType
	// curationNodeIconURL?: string,
	curationNodeTranslatedTitle?: string;
	masteryPercentage?: "I don't know";

	// GroupedBadgeNotificationType
	badgeNotifications?: { badge: BadgeNotif }[];

	// InfoNotificationType
	notificationType?: "I don't know";

	// ModeratorNotificationType
	text?: string;

	// ProgramFeedbackNotificationType
	authorAvatarSrc?: string;
	authorNickname?: string;
	feedbackType?: "QUESTION" | "REPLY" | "COMMENT";
	translatedScratchpadTitle?: string;
	content?: string;

	// ResponseFeedbackNotificationType
	authorAvatarUrl?: string;
	// authorNickname?: string,
	// feedbackType?: "QUESTION" | "REPLY" | "COMMENT",
	focusTranslatedTitle?: string;
	// content?: string,
	sumVotesIncremented?: number;
}

interface BadgeNotif {
	badgeCategory: number;
	description: string;
	fullDescription: string;
	name: string;
	icons: {
		compactUrl: string,
	};
}

interface NotificationResponse {
	user: {
		"__typename": "User",
		id: string,
		kaid: string,
		notifications: {
			"__typename": "NotificationsPage",
			pageInfo: {
				"__typename": "PageInfo",
				// This is cursed since it should have properties for `cursor` and `complete`, and instead it just has a `nextCursor` value, which is null if there is no next cursor.
				nextCursor: null
			}
			notifications: Notification[]
		}
	};
}

/*interface NotifObj {
	cursor: string;
	notifications: Notification[];
	has_more: boolean;
}*/

interface FeedbackFocus {
	"__typename": "FeedbackFocus";
	id: string;
	kind: string;
	relativeUrl: string;
	translatedTitle: string;
}

interface CommentData {
	"__typename": "BasicFeedback";
	expandKey: string;
	key: string;
	author: {
		"__typename": "User",
		kaid: string;
		nickname: string;
		"avatar": {
			"__typename": "Avatar";
			imageSrc: string;
			name: string;
		}
	};
	content: string;

	focus: FeedbackFocus;
	focusUrl: string;
	flags?: string[];
	flaggedBy: null;
	flaggedByUser: boolean;
	appearsAsDeleted: boolean;
	definitelyNotSpam: boolean;
	lowQualityScore: number;
	replyCount: number;
	replyExpandKeys: string[];
	showLowQualityNotice: boolean;
	sumVotesIncremented: number;
	upVoted: boolean;
}

interface CommentResponse {
	feedback: {
		"__typename": "FeedbackForFocus";
		cursor: string | null;
		feedback: CommentData[];
		isComplete: true;
		sortedByDate: false;
	};
}

interface NotifElm {
	href: string;
	imgSrc: string;
	content: string;
	date: string;
	authorNote: string;
	// isComment: boolean;
	programID: string;
	feedback: string;
}

interface ScratchpadUI {
	scratchpad: {
		id: number;
		attributes: Program;
	};
}

interface EditorOptions {
	fontFamily: string;
	showInvisibles: boolean;
	tabSize: number;
	theme: string;
	useSoftTabs: boolean;
	wrap: boolean;
	useWorker: boolean;
	behavioursEnabled: boolean;
	wrapBehavioursEnabled: boolean;
}

interface ACE {
	edit: (e: HTMLElement) => {
		setOptions: (o: EditorOptions) => void;
		setOption: (o: string, val: ACE_OPTION) => void;
		getSession: () => {
			getMode: () => {
				$id: string;
			};
			setMode: (mode: any) => void; /* tslint:disable-line:no-any */
		};
		session: {
			getValue: () => string;
			setValue: (data: string) => void;
		};
	};
	config: {
		set: (o: string, val: string) => void;
	};
	require: (mode: string) => { Mode: any }; /* tslint:disable-line:no-any */
}

type ACE_OPTION = boolean | number | string;

declare global {
	interface Window {
		ace: ACE;
		ScratchpadUI?: ScratchpadUI;
		ScratchpadAutosuggest: { enableLiveCompletion: () => void; };
		$LAB: { queueWait: (f: () => void) => void; };
		__APOLLO_CLIENT__: {
			cache: {
				data: {
					data: {
						[index: string]: string;
					}
				}
			}
		};
	}
}

export {
	InvalidUsernameOrKaid, IdType, UsernameOrKaid,
	CommentSortType, Program, Notification,
	Scratchpads, UserProfileData,
	CommentResponse, CommentData,
	NotificationResponse, NotifElm, ScratchpadUI,
	EditorOptions, ACE, ACE_OPTION,
	User, OldScratchpad, BadgeNotif
};
