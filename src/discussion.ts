import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { parseQuery } from "./util/text-util";
import { checkSettingsDark } from "./editor-settings";
import {
	EXTENSION_COMMENT_CLASSNAME, EXTENSION_COMMENT_DARK
} from "./types/names";

import hljs from "highlight.js";

hljs.configure({
	languages: ["html", "javascript", "css", "sql"],
});

function updateComments (): void {
	//TODO: Add a listener to the post button so new comments are found
	//TODO: Add a listener to the sort sector (voted or recent)
	//TODO: Flag information on replies (no good way to get the ID's, IIRC)
	//TODO: Bug: Opening a direct link to comment causes the replies to be automatically unfolded, and they aren't found
	//TODO: I've had this take up to 5-6 seconds. Won't fix until querySelectorAllPromise is refactored
	querySelectorAllPromise(`div[data-test-id='discussion-post']:not(.${EXTENSION_COMMENT_CLASSNAME})`, 100, 40)
		.then((unalteredComments: NodeList) => {
			//Find the load more comments button, and attach an event listener to it.
			const moreCommentsButton = Array.from((unalteredComments[0].parentNode!.parentNode!.parentNode!.parentNode as HTMLElement).children).slice(-1)[0];
			if (moreCommentsButton && moreCommentsButton instanceof HTMLButtonElement) {
				console.assert(moreCommentsButton.textContent!.slice(-3) === "...");
				moreCommentsButton.addEventListener("click", updateComments);
			}

			//Loop through all unalteredComments and apply any modifications to them
			for (let i = 0; i < unalteredComments.length; i++) {
				const comment = unalteredComments[i] as HTMLElement;
				const flagButton = comment.querySelector("button[id^=uid-discussion-list-][id$=-flag]");
				const timestampLink = comment.querySelector("a[href*=qa_expand_key]");

				//Replies to comments don't have a hyperlink or ID
				if (timestampLink) {
					//Extract the comment id from the link to the comment
					const commentId = (timestampLink as HTMLAnchorElement)!.href.match(/qa_expand_key=(.*?)(?:&|$)/)![1];

					// Update comments after a new comment is made on this thread/post
					const area = comment.querySelector(
						"[id^=\"uid-discussion-input-\"]" +
						"[id$=\"-content-input\"]");
					if (area) {
						area?.addEventListener("focus", () => {
							const commentButton = comment.querySelector("[aria-label=\"Comment\"]");
							if (!commentButton) { return; }
							commentButton.addEventListener("click", updateComments);
						});
					}

					//Look for replies button and add an event listener to it
					const showCommentsButton = comment.querySelector("[aria-controls*=-replies-container]");
					if (showCommentsButton) {
						//{ once: true } so that the listener is automatically removed after firing once
						//Replies, once loaded once, are kept in the DOM tree, just hidden
						showCommentsButton.addEventListener("click", updateComments, { once: true });
					} else {
						console.error("Replies button expected under top-level comment.");
					}

					//Button for answers to questions (now called "Replies" in the UI)
					const answerForm = comment.querySelector("[id$=-answer-input]");
					if (answerForm) {
						const answersWrap = answerForm.parentNode!;
						const showMoreAnswersButton = Array.from((answersWrap as HTMLDivElement).children).slice(-1);
						showMoreAnswersButton[0].addEventListener("click", updateComments);
					} else {
						//Not a question; not an issue
					}
				}

				comment.classList.add(EXTENSION_COMMENT_CLASSNAME);

				//Init syntax highlighting
				const blocks = comment.querySelectorAll<HTMLElement>("pre code.discussion-code-block");
				for (const el of Array.from(blocks)) {
					el.innerHTML = el.innerHTML
						.replace(/\<br\>/g, "\n")
						// Sometimes ka's bolding causes unescaped
						// html warnings because they are rendered
						// as raw <strong> tags
						.replace(/<\/?strong>/g, "*");

					if (checkSettingsDark()) {
						el.classList.add(EXTENSION_COMMENT_DARK);
					}

					hljs.highlightElement(el);
				}
			}

		}).catch(e => {
			if (e.toString().indexOf("Error: Could not find") === 0) {
				//There are known cases where updateComments is called at the possiblity of new comments
				//Not finding new comments is fine
			}else {
				console.error(e); //Other errors are not okay
			}
		});
}

const commentButtonNames = ["Post tip or thanks", "Ask question", "Request help"];
function commentsButtonEventListener (): void {
	// updateComments doesn't work on qa expanded pages
	if (qaExpanded()) {
		setInterval(updateComments, 500);
		return;
	}

	//Select tab buttons. The check for being on a discussion page saw that these were loaded
	const discussionTabs = document.querySelectorAll("[data-test-id=\"discussion-tab\"]");

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
	);

	// Highlight new posts after they are made
	querySelectorPromise("#uid-discussion-input-1-content-input").then(userTextarea => {
		userTextarea.addEventListener("focus", () => {
			for (const label of commentButtonNames) {
				const button = document.querySelector(`[aria-label="${label}"]`);
				if (!button) { continue; }
				button.addEventListener("click", updateComments);
			}
		});
	});
}

function qaExpanded () {
	return parseQuery(window.location.search.substr(1)).hasOwnProperty("qa_expand_key");
}

function switchToTipsAndThanks () {
	querySelectorPromise("#ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-1").then(tabButton => tabButton as HTMLButtonElement).then(tabButton => {
		//Don't switch to T&T if you have followed a direct link to question
		if (qaExpanded()) {
			return;
		}

		const y = document.body.scrollTop;

		tabButton.dispatchEvent(new MouseEvent("click", { "view": window, "bubbles": true }));

		window.setTimeout(function () {
			window.scrollTo(0, y);
			tabButton.blur();
		}, 0);
	}).catch(console.error);
}

export { commentsButtonEventListener, switchToTipsAndThanks, updateComments };
