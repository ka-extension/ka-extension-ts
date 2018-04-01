import "whatwg-fetch";
import { CSRF_HEADER } from "../names";
import { getCSRF } from "./cookie-util";
import * as P from "bluebird";

async function getJSON(url: URL | string, projection?: object) {
    url = new URL(url.toString());
    if(projection) {
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
            response : P.Promise.reject(response))
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

export { getJSON };