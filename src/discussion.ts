import { UsernameOrKaid } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getComment } from "./util/api-util";
import {
	EXTENSION_COMMENT_CLASSNAME,
} from "./types/names";

function updateComments (): void {
	querySelectorAllPromise(`div[data-test-id='discussion-post']:not(.${EXTENSION_COMMENT_CLASSNAME})`, 100)
		.then((unalteredComments: NodeList) => {
			//Find the load more comments button, and attach an event listener to it.
			//TODO: Make not trash
			//TODO: Fails if there are no more comments; i.e., no button
			Array.from((unalteredComments[0].parentNode!.parentNode!.parentNode!.parentNode as HTMLDivElement).children).slice(-1)[0].addEventListener("click", updateComments);
			
			for (let i = 0; i < unalteredComments.length; i++) {
				const comment = unalteredComments[i] as HTMLElement;
				//TODO: Fails if there's a reply on the page (is a 'discussion-post'; not extension modified; no link; no way the id; generally annoying.)
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
	//Select tab buttons. The check for being on a discussion page saw that these were loaded
	let discussionTabs = document.querySelectorAll("[data-test-id=\"discussion-tab\"]");
	
	if (!discussionTabs || !discussionTabs.length) {
		console.error("Discussion tabs were loaded but now aren't.");
	}
	
	//Listeners for switching discussion tabs
	Array.from(discussionTabs).map(discussionTab => discussionTab as HTMLButtonElement).forEach(discussionTab =>
		discussionTab.addEventListener("click", () => {
			if (!discussionTab.classList.contains("kae-discussion-tab-selected")) {
				Array.from(document.querySelectorAll(".kae-discussion-tab-selected")).forEach(el => el.classList.remove("kae-discussion-tab-selected"));
				discussionTab.classList.add("kae-discussion-tab-selected");
				updateComments();
			}
		})
	)
}

function switchToTipsAndThanks () {
	querySelectorPromise("#ka-uid-discussiontabbedpanel-1--tabbedpanel-tab-1").then(tabButton => tabButton as HTMLButtonElement).then(tabButton => {
		//TODO: Don't switch to T&T if you have followed a direct link to question
		const y = document.body.scrollTop;

		tabButton.dispatchEvent(new MouseEvent("click", { "view": window, "bubbles": true }));

		window.setTimeout(function () {
			window.scrollTo(0, y);
		}, 0);
	}).catch(console.error);
}

export { commentsButtonEventListener, switchToTipsAndThanks };
