import queries from "./graphqlQueries.json";
import { CSRF_HEADER } from "../types/names";
import { UsernameOrKaid, UserProfileData } from "../types/data";
import { getCSRF } from "./cookie-util";

// Typed names for queries in graphqlQueries.json
enum GraphqlQuery {
	PROFILE = "getFullUserProfile",
	VOTE = "VoteEntityMutation",
	PROFILE_PROJECTS = "projectsAuthoredByUser",
}

// Data to be overriden if context is outside of content script
interface OverrideData {
	fkey?: string;
	origin?: string;
}

// Generic authenticated graphql request
function graphql<T> (query: GraphqlQuery, variables: object, over: OverrideData = {}) : Promise<T> {
	const origin = over.origin ? over.origin : window.location.origin;
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

// Generic function for async loading items from KA's cursor  based API endpoints
// Should only be used inside here because of the amount of metaprogramming required
// to get the types to check out
async function* cursorList<T, Params, RawResponse, CursorBody extends Cursor> (
	query: GraphqlQuery,
	vars: Params,
	findCursor: (o: RawResponse) => CursorBody,
	findList: (o: CursorBody) => T[],
	setCursor: (p: Params, c: string) => void,
	pageCap?: number,
) : AsyncGenerator<T[], number, void> {
	let i = 0, complete = false, cursor = "";
	for (; !complete && (pageCap === undefined || i < pageCap); i++) {
		setCursor(vars, cursor);
		const results = await graphql<RawResponse>(query, vars as object);

		const cursorBody = findCursor(results);
		if (cursorBody === null) {
			return i;
		}

		({ complete, cursor } = cursorBody);
		yield findList(cursorBody);
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
	const params: ProfileProgramParams = {
		sort: options.sort || ProfileSort.TOP,
		pageInfo: {
			cursor: "",
			itemsPerPage: options.limit || 40,
		},
	};

	if (options.kaid) {
		params.kaid = options.kaid;
	}

	return cursorList<ScratchpadSnapshot, ProfileProgramParams,
		RawProfileProgramResponse, ProfileProgramsCursor>(
			GraphqlQuery.PROFILE_PROJECTS, params,
			raw => raw.user.programs, cursor => cursor.programs,
			(params, c) => params.pageInfo.cursor = c, options.pages,
		);
}

export {
	getUserData, setVote, OverrideData,
	GetUserScratchpadsOptions, ScratchpadSnapshot, ProfileSort,
	getUserScratchpads,
};
