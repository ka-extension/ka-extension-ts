import "whatwg-fetch";
import { CSRF_HEADER } from "../names";
import { getCSRF } from "./cookie-util";
import { buildQuery } from "./text-util";
import { UsernameOrKaid, CommentSortType, Program } from "../data";

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
        // credentials: "include"
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

export { getJSON, FocusData, CommentData, commentDataGenerator, getProgram };
