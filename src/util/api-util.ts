import "whatwg-fetch";
import { CSRF_HEADER } from "../types/names";
import { getCSRF } from "./cookie-util";
import { OldScratchpad, UsernameOrKaid, UserProfileData } from "../types/data";
import { buildQuery } from "./text-util";

const requestCache: { [name: string]: object } = {};

async function getJSON (urlVal: URL | string, projection?: object, cache: boolean = false): Promise<object> {
	const url = new URL(urlVal.toString());

	if (projection) {
		url.searchParams.append("projection", JSON.stringify(projection));
	}

	// Storing requests is useful in the case of KA's SPA refreshes
	// Yield stored value if it exists
	if (cache) {
		const str = url.toString();
		const cachedValue = requestCache[str];
		if (cachedValue) {
			return Promise.resolve(cachedValue);
		}
	}

	const response: Response | undefined = await fetch(url.toString(), {
		method: "GET",
		headers: {
			[CSRF_HEADER]: getCSRF()
		},
		credentials: "same-origin"
	})
		.then((response: Response): (Promise<Response> | Response) =>
			response.status >= 200 && response.status < 300 ?
				response : Promise.reject(response))
		.catch((e => void console.error(e)));
	if (response === undefined) {
		throw new Error(`Error fetching ${url}`);
	}

	const body: object | undefined = response.json()
		.then(val => {
			if (cache) {
				requestCache[url.toString()] = val;
			}
			return val;
		})
		.catch(e => void console.error(e));
	if (body === undefined) {
		throw new Error(`Error parsing body for ${url}`);
	}

	return body;
}

async function putPostJSON (url: URL | string, json: object = {}, method: "PUT" | "POST" = "POST"): Promise<object> {
	url = new URL(url.toString());

	const response: Response | undefined = await fetch(url.toString(), {
		method,
		headers: {
			[CSRF_HEADER]: getCSRF(),
			"Content-type": "application/json"
		},
		credentials: "same-origin",
		body: JSON.stringify(json)
	})
		.then((response: Response): (Promise<Response> | Response) =>
			response.status >= 200 && response.status < 300 ?
				response : Promise.reject(response))
		.catch((e => void console.error(e)));
	if (response === undefined) {
		throw new Error(`Error fetching ${url}`);
	}

	const body: object | undefined = response.json().catch(e => void console.error(e));
	if (body === undefined) {
		throw new Error(`Error parsing body for ${url}`);
	}

	return body;
}

function deleteNotif (key: string): Promise<Response> {
	return fetch(`${window.location.origin}/api/internal/user/notifications/${key}`, {
		method: "DELETE",
		headers: {
			[CSRF_HEADER]: getCSRF()
		},
		credentials: "same-origin"
	}).then(e => e.status >= 200 && e.status < 300 ? Promise.resolve(e) : Promise.reject(e));
}

interface FocusData {
	id: string;
	kind: string;
}

interface CommentData {
	expandKey: string;
	key: string;
	authorKaid: string;
	focus: FocusData;
	focusUrl: string;
	flags: string[];
}

interface CommentResponse {
	feedback: CommentData[];
}

enum DiscussionTypes {
	QUESTION = "question",
	COMMENT = "comment"
}

interface ConvoTATFocusRaw {
	relativeUrl: string;
}

interface ConvoReplyRaw {
	authorKaid: string;
	authorNickname: string;
	content: string;
	date: string;
	key?: string;
}

interface ConvoTATRaw {
	focus: ConvoTATFocusRaw;
	feedback: ConvoReplyRaw[];
}

interface FinalConvo {
	url: string;
	baseTip: FinalReply;
	replies: FinalReply[];
}

interface FinalReply {
	nickname: string;
	profileUrl: string;
	epoch: number;
	content: string;
}

function getConvo (key: string, focusKind: string, focusId: string, discussionType: DiscussionTypes): Promise<FinalConvo> {
	return Promise.all([
		getJSON(`${window.location.origin}/api/internal/discussions/${focusKind}/${focusId}/${discussionType}?${buildQuery({
			casing: "camel",
			qa_expand_key: key,
			sort: "1",
			subject: "all",
			limit: "1",
			page: "0",
			lang: "en",
			_: Date.now() + ""
		})}`, {
				focus: {
					relativeUrl: 1
				},
				feedback: [
					{
						normal: {
							authorKaid: 1,
							authorNickname: 1,
							content: 1,
							date: 1,
							key: 1
						}
					}
				]
			}).then(e => e as ConvoTATRaw),
		getJSON(`${window.location.origin}/api/internal/discussions/${key}/replies`, [
			{
				normal: {
					authorKaid: 1,
					authorNickname: 1,
					content: 1,
					date: 1
				}
			}
		]).then(e => e as ConvoReplyRaw[])
	]).then(e => {
		const [base, replies] = e;
		return base.feedback.length > 0 && base.feedback[0].key !== key ? Promise.reject("That T&T doesn't exist") : Promise.resolve({
			url: `https://www.khanacademy.org${base.focus.relativeUrl}?qa_expand_key=${key}`,
			baseTip: {
				nickname: base.feedback[0].authorNickname,
				profileUrl: `https://www.khanacademy.org/profile/${base.feedback[0].authorKaid}`,
				epoch: new Date(base.feedback[0].date).getTime(),
				content: base.feedback[0].content
			},
			replies: replies.map(e => ({
				nickname: e.authorNickname,
				profileUrl: `https://www.khanacademy.org/profile/${e.authorKaid}`,
				epoch: new Date(e.date).getTime(),
				content: e.content
			} as FinalReply))
		} as FinalConvo);
	});
}

function getComment (key: string): Promise<CommentData> {
	return getJSON(`${window.location.origin}/api/internal/discussions/scratchpad/5444013900333056/comments?${buildQuery({
		casing: "camel",
		qa_expand_key: key,
		sort: "1",
		subject: "all",
		limit: "1",
		page: "0",
		lang: "en",
		_: Date.now() + ""
	})}`, {
			feedback: [
				{
					normal: {
						flags: 1
					}
				}
			]
		}).then(data => data as CommentResponse).then(data => data.feedback[0]);
}

function getOldScratchpad (id: string, proj?: object, cached = false) : Promise<OldScratchpad> {
	const url = window.location.origin + "/api/internal/show_scratchpad?scratchpad_id=";
	return getJSON(url + id, proj, cached)
		.then(e => e as OldScratchpad);
}

export {
	getJSON, getComment, FocusData, CommentData,
	getConvo, FinalReply, FinalConvo,
	DiscussionTypes, deleteNotif, putPostJSON,
	getOldScratchpad
};
