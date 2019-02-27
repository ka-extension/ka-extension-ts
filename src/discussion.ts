import { UsernameOrKaid } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getComment } from "./util/api-util.ts";
import {
	EXTENSION_COMMENT_CLASSNAME,
} from "./types/names";

function updateComments (): void {
	querySelectorAllPromise(`div[data-test-id='discussion-post']:not(.${EXTENSION_COMMENT_CLASSNAME})`, 100)
		.then((unalteredComments: NodeList) => {
			for (let i = 0; i < unalteredComments.length; i++) {
				const comment = unalteredComments[i] as HTMLElement;
				const flagControls = comment.querySelector("button[id^=uid-discussion-list-][id$=-flag]");
				//Extract the comment id from the link to the comment
				const commentId = (comment.querySelector("a[href*=qa_expand_key]") as HTMLAnchorElement).href.match(/qa_expand_key=(.*?)(?:&|$)/)![1];

				getComment(commentId).then((data) => {
					if (flagControls && data && data.flags && data.flags.length) {
						const flagsText = flagControls.querySelector("div[class^=default_olfzxm-o_O-flagText_1ajw024]");
						flagsText!.textContent += ` (${data.flags.length})`;
						flagControls.setAttribute("title", data.flags.join("\n"));
					}
				}).catch(console.error);

				comment.classList.add(EXTENSION_COMMENT_CLASSNAME);
			}
		}).catch(console.error);
}

function commentsButtonEventListener (uok: UsernameOrKaid): void {
	querySelectorPromise(".button_1eqj1ga-o_O-shared_1t8r4tr-o_O-default_9fm203", 100)
		.then(button => {
			button.addEventListener("click", updateComments);
			updateComments();
		}).catch(console.error);
}

function switchToTipsAndThanks () {
	querySelectorPromise("#ka-uid-discussiontabbedpanel-1--tabbedpanel-tab-1").then(tabButton => tabButton as HTMLButtonElement).then(tabButton => {
		tabButton.click();
	}).catch(console.error);
}

export { commentsButtonEventListener, switchToTipsAndThanks };
