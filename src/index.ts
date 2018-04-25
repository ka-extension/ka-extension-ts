import { querySelectorAllPromise  } from "./util/promise-util";
import { getCSRF } from "./util/cookie-util";
import { getJSON } from  "./util/api-util";
import { buildQuery } from "./util/text-util";
import { commentsButtonEventListener } from "./comment-data";

const computingUrls: string[] = [ "computer-programming", "hour-of-code", "computer-science", "pixar" ];
const url: string[] = window.location.href.split("/");

if (window.location.host.includes("khanacademy.org")) {
    if (computingUrls.indexOf(url[3]) > -1) {
        
    } else if (url[3] === "profile") {
        if(url[5] == "discussion" && url[6] == "replies") {
            commentsButtonEventListener(url[4]);
        }
    }
}