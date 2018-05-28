import "whatwg-fetch";
import { CSRF_HEADER } from "../types/names";
import { getCSRF } from "./cookie-util";
import { buildQuery } from "./text-util";
import { UsernameOrKaid, CommentSortType, Program } from "../types/data";

async function getJSON(url: URL | string, projection?: object) {
    url = new URL(url.toString());
    if (projection) {
        url.searchParams.append("projection", JSON.stringify(projection));
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
    if (response == undefined) {
        throw new Error(`Error fetching ${url}`);
    }

    const body: object | undefined = response.json().catch(e => void console.error(e));
    if (body == undefined) {
        throw new Error(`Error parsing body for ${url}`);
    }

    return body;
}

function getProgram(programId: string | number): Promise<Program> {
    return getJSON(`${window.location.origin}/api/labs/scratchpads/${programId.toString()}`)
        .then(e => e as Program);
}

interface FocusData {
    id: string;
    kind: string;
}

interface CommentData {
    expandKey: string;
    key: string;
    focus: FocusData;
    focusUrl: string;
}

// Symbol.asyncIterator polyfill
if (Symbol["asyncIterator"] === undefined) {
    ((Symbol as any)["asyncIterator"]) = Symbol.for("asyncIterator");
}

async function* commentDataGenerator(user: UsernameOrKaid, sort: CommentSortType = CommentSortType.TOP, limit: number = 10): AsyncIterator<CommentData[]> {
    let page: number = 0;
    for (;;) {
        const body: CommentData[] | undefined = await getJSON(`${window.location.origin}/api/internal/user/replies?${buildQuery({
            casing: "camel",
            [user.type]: user.toString(),
            sort: sort.toString(),
            subject: "all",
            limit: limit.toString(),
            page: (page++).toString(),
            _: Date.now().toString()
        })}`).then(e => e as CommentData[]).catch(e => void console.error(e));
        if(!body) {
            return;
        } else {
            yield body;
        }
    }
}

enum DiscussionTypes {
    QUESTION = "question",
    COMMENT = "comment"
}

interface ConvoTATFocusRaw {
    relativeUrl: string
}

interface ConvoReplyRaw {
    authorKaid: string,
    authorNickname: string,
    content: string,
    date: string,
    key?: string
}

interface ConvoTATRaw {
    focus: ConvoTATFocusRaw
    feedback: ConvoReplyRaw[]
}

interface FinalConvo {
    url: string,
    baseTip: FinalReply,
    replies: FinalReply[]
}

interface FinalReply {
    nickname: string,
    profileUrl: string,
    epoch: number,
    content: string
}

function getConvo(key: string, focusKind: string, focusId: string, discussionType: DiscussionTypes): Promise<FinalConvo> {
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
        return base.feedback.length > 0 && base.feedback[0].key != key ? Promise.reject("That T&T doesn't exist") : Promise.resolve({
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

export { 
    getJSON, FocusData, CommentData, 
    commentDataGenerator, getProgram, 
    getConvo, FinalReply, FinalConvo,
    DiscussionTypes
};
