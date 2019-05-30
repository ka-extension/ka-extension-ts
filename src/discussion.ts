import { UsernameOrKaid } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getComment } from "./util/api-util";
import {
	EXTENSION_COMMENT_CLASSNAME,
} from "./types/names";

function updateComments (): void {
	console.log("Checking for new comments");
	
	//TODO: Add a listener to the post button so new comments are found
	//TODO: Bug: Opening a direct link to comment causes the replies to be automatically unfolded, and they aren't found
	querySelectorAllPromise(`div[data-test-id='discussion-post']:not(.${EXTENSION_COMMENT_CLASSNAME})`, 50 /*ms*/, 20 /*attempts*/)
		.then((unalteredComments: NodeList) => {
			console.log("Found new comments");
			//Find the load more comments button, and attach an event listener to it.
			//TODO: refactor
			//TODO: fails if there are no more comments; i.e., no button
			//TODO: fails if replies have just been opened, in which case the parentNode chain selects the wrong thelment.
			// Array.from((unalteredComments[0].parentNode!.parentNode!.parentNode!.parentNode as HTMLDivElement).children).slice(-1)[0].addEventListener("click", () => { console.log("1"); updateComments(); });
			
			//Loop through all unalteredComments and apply any modifications to them
			for (let i = 0; i < unalteredComments.length; i++) {
				const comment = unalteredComments[i] as HTMLElement;
				const flagButton = comment.querySelector("button[id^=uid-discussion-list-][id$=-flag]");
				const timestampLink = comment.querySelector("a[href*=qa_expand_key]");
				
				//Replies to comments don't have a hyperlink or ID
				if (timestampLink) {
					//Extract the comment id from the link to the comment
					const commentId = (timestampLink as HTMLAnchorElement)!.href.match(/qa_expand_key=(.*?)(?:&|$)/)![1];
					
					getComment(commentId).then((data) => {
						if (flagButton && data && data.flags) {
							const flagText = flagButton.querySelector("div");
							flagText!.textContent += ` (${data.flags.length})`;
							flagButton.setAttribute("title", data.flags.join("\n"));
						}
					}).catch(console.error);
					
					//Look for replies button and add an event listener to it
					//TODO: Button for answers to questions ("Replies")
					const showCommentsButton = comment.querySelector("[aria-controls*=-replies-container]");
					if (showCommentsButton) {
						//{ once: true } so that the listener is automatically removed after firing once
						//Replies, once loaded once, are kept in the DOM tree, just hidden
						showCommentsButton.addEventListener("click", updateComments, { once: true });
					}else {
						console.error("Replies button expected under top-level comment.");
					}
				}

				comment.classList.add(EXTENSION_COMMENT_CLASSNAME);
			}
		}).catch(() => {
			//There are known cases where updateComments is called at the possiblity of new comments
			//Not finding new comments is fine
			console.log("Didn't find new comments.");
		});
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
