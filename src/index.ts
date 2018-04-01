import { querySelectorAllPromise  } from "./util/promise-util";
import { getCSRF } from "./util/cookie-util";
import { getJSON } from  "./util/api-util";
import { buildQuery } from "./util/text-util";

// Testing
console.log(buildQuery({
    "thing  s": "something",
    "ese": "another #@( thing"
}));
console.log(getCSRF());
getJSON("https://www.khanacademy.org/api/internal/user/profile?kaid=kaid_1063314115048600759228780", { isSelf: 1 }).then(console.log).catch(console.error);
querySelectorAllPromise(".link_1uvuyao-o_O-noUnderline_4133r1").then(console.log).catch(console.error);