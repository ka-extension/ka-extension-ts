import queries from "./graphqlQueries.json";
import { CSRF_HEADER } from "../types/names";
import { UsernameOrKaid, UserProfileData, CommentResponse, CommentData, NotificationResponse, Notification } from "../types/data";

import { getCSRF } from "./cookie-util";

// Typed names for queries in graphqlQueries.json
enum GraphqlQuery {
	PROFILE = "getFullUserProfile",
	VOTE = "VoteEntityMutation",
	PROFILE_PROJECTS = "projectsAuthoredByUser",
	FEEDBACK_QUERY = "feedbackQuery",
	NOTIFICATIONS_QUERY = "getNotificationsForUser"
}

// Data to be overriden if context is outside of content script
interface OverrideData {
	fkey?: string;
	origin?: string;
}

function getOrigin(overrideOrigin: string|undefined) {
	if (overrideOrigin) {
		return overrideOrigin;
	}
	if (window.location.origin.includes("chrome-extension")) {
		return "https://www.khanacademy.org"
	}
	return window.location.origin;
}

// Generic authenticated graphql request
function graphql<T> (query: GraphqlQuery, variables: object, over: OverrideData = {}) : Promise<T> {
	const origin = getOrigin(over.origin);
	const url = origin + "/api/internal/graphql/" + query;
	return fetch(url, {
		method: "POST",
		headers: {
			[CSRF_HEADER]: over.fkey ? over.fkey : getCSRF(),
			"content-type": "application/json"
		},
		body: JSON.stringify({
			operationName: query,
			query: queries[query],
			variables,
		}),
		credentials: "same-origin"
	})
		.then(response => {
			if (response.status === 200) {
				return response.json();
			} else {
				return response.text().then(txt => Promise.reject(
					`Error in GraphQL ${query} call: ` +
					"Server responded with status " +
					JSON.stringify(response.statusText) +
					" and body " + JSON.stringify(txt)
				));
			}
		})
		.then(e => e.data as T);
}

// Transform username or kaid into graphql variable payload
function addProfileParams (uok?: UsernameOrKaid, vars: ProfileParams = {}) {
	if (uok) {
		if (uok.asKaid()) {
			vars.kaid = uok.toString();
		} else if (uok.asUsername()) {
			vars.username = uok.toString();
		}
	}

	return vars;
}

interface ProfileParams {
	kaid?: string;
	username?: string;
}

function getUserData (uok?: UsernameOrKaid, over: OverrideData = {}) : Promise<UserProfileData> {
	return graphql<{ user: UserProfileData }>(GraphqlQuery.PROFILE, addProfileParams(uok), over)
		.then(e => e.user);
}

interface VoteEntity {
	voteEntity: {
		error?: string;
	};
}

function setVote (key: string, value: boolean) : Promise<boolean> {
	return graphql<VoteEntity>(GraphqlQuery.VOTE, {
		voteType: value ? 1 : 0,
		postKey: key,
	})
		.then(e => e.voteEntity.error ? Promise.reject("Server returned error: "
			+ JSON.stringify(e.voteEntity.error)) : value);
}

// Base interface for cursor objects
interface Cursor {
	complete: boolean;
	cursor: string;
}

// Generic function for async loading items from KA's cursor based API endpoints
// Should only be used inside here because of the amount of metaprogramming required
// to get the types to check out
// This function is generic on 4 types.
//  T is the type of the data that we're going to return a list of
//  Params is the type/shape of the graphQL variables
//  RawResponse is the type of the json data that we get back from the endpoint, after accessing .data
//  CursorBody is the type of the data after
// We return an async generator of lists (pages) of T

async function* cursorList<T, Vars extends Object, RawResponse> (
	query: GraphqlQuery, // Which query we're making
	// vars: Params, // The variables that the request needs
	getVars: (c: string) => Vars,
	
	findCursor: (o: RawResponse) => Cursor, // Right now this returns the object that has a .cursor and a .complete property. That doesn't exist for us on the notification page, so we need to refactor this to return a tuple or a created object with these two properties.
	findList: (o: RawResponse) => T[], // This should just take the RawResponse as well.

	// setCursor: (p: Params, c: string) => void, // this is really "update the cursor value stored in params". It's really getParams, just not-pure

	pageCap?: number,
) : AsyncGenerator<T[], number, void> {
	let i = 0, complete = false, cursor = "";
	for (; !complete && (pageCap === undefined || i < pageCap); i++) {
		const vars = getVars(cursor);
		const results = await graphql<RawResponse>(query, vars);

		// if (cursorBody === null) {
		// 	return i;
		// }

		({ complete, cursor } = findCursor(results));
		yield findList(results);
	}

	return i;
}


// Base param interface for hotlist and user programs page
interface ScratchpadListParams<Sort> extends ProfileParams {
	sort: Sort;
	pageInfo: {
		cursor: string,
		itemsPerPage: number,
	};
}
type ProfileProgramParams = ScratchpadListParams<ProfileSort>;
enum ProfileSort {
	TOP = "TOP",
	RECENT = "RECENT",
}
interface ScratchpadSnapshot {
	authorKaid: string;
	authorNickname: string;
	displayableSpinoffCount: number;
	id: string;
	imagePath: string;
	key: string;
	sumVotesIncremented: number;
	translatedTitle: string;
	url: string;
}

interface RawProfileProgramResponse {
	user: {
		programs: ProfileProgramsCursor
	};
}

interface ProfileProgramsCursor extends Cursor {
	programs: ScratchpadSnapshot[];
}

// The actual typed options for the call
interface GetUserScratchpadsOptions {
	kaid?: string;
	pages?: number;
	limit?: number;
	sort?: ProfileSort;
}

// Fetch the scratchpads
function getUserScratchpads (options: GetUserScratchpadsOptions = {}) : AsyncGenerator<ScratchpadSnapshot[], number, void> {
	const getVars = (cursor: string): ProfileProgramParams => ({
		kaid: options.kaid || undefined,
		sort: options.sort || ProfileSort.TOP,
		pageInfo: {
			cursor: cursor,
			itemsPerPage: options.limit || 40,
		},
	});

	return cursorList<ScratchpadSnapshot, ProfileProgramParams, RawProfileProgramResponse>(
		GraphqlQuery.PROFILE_PROJECTS, // query
		getVars, // var
		data => data.user.programs, // find cursor
		data => data.user.programs.programs, // find list
		options.pages,
	);
}

interface NotificationVars {
	after: string, // The cursor offset
}

export function getUserNotifications () {
	const getVars = (cursor:string) => ({
		after: cursor
	});
	
	return cursorList<Notification, NotificationVars, NotificationResponse>(
		GraphqlQuery.NOTIFICATIONS_QUERY,
		getVars,
		// get cursor info
		data => {
			const pageInfo = data.user.notifications.pageInfo;
			return ({
				complete: !pageInfo.nextCursor,
				cursor: pageInfo.nextCursor || ""
			})
		},
		data => data.user.notifications.notifications
	);
}

// Gets a single comment
// Uses a trick:
//  It requests all the comments under the program listed, which
//  is a special program with no comments. It then specifies
//  the requested comment as the focused comment under the program.
//  This adds the requested comment to the response, even though
//  the requested comment was originally posted on this program.
// This method doesn't work for getting replies, only T&T and questions,
// So this function will error if given a key to a reply.
async function getComment(key: string): Promise<CommentData> {
	return graphql<CommentResponse>(GraphqlQuery.FEEDBACK_QUERY, {
		topicId: "5444013900333056",
		currentSort: 1,
		feedbackType: "QUESTION", // What the type is doesn't matter, but has to be valid
		focusKind: "scratchpad",
		qaExpandKey: key
	}).then(data => data.feedback.feedback[0]);
}

export {
	getUserData, getComment, setVote, OverrideData,
	GetUserScratchpadsOptions, ScratchpadSnapshot, ProfileSort,
	getUserScratchpads,
};
