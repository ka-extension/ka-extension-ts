import { commentDataGenerator, CommentData } from "./util/api-util";
import { UsernameOrKaid, CommentSortType } from "./types/data";
import { getCSRF } from "./util/cookie-util";
import { KAMarkdowntoHTML, HTMLtoKAMarkdown } from "./util/text-util";
import { querySelectorPromise } from "./util/promise-util";
import flatten from "lodash.flatten";
import zipObject from "lodash.zipobject";
import {
	EXTENSION_ITEM_CLASSNAME,
	EXTENSION_COMMENT_CLASSNAME,
	EXTENSION_COMMENT_EDIT_CLASSNAME,
	EXTENSION_COMMENT_EDIT_CLASS_PREFIX,
	EXTENSION_COMMENT_EDIT_UI_CLASS,
	EXTENSION_COMMENT_CANCEL_EDIT_PREFIX
} from "./types/names";

class CommentDataIterator {
	private complete: boolean = false;
	private readonly generator: AsyncIterator<CommentData[]>;
	constructor (user: UsernameOrKaid, sort: CommentSortType = CommentSortType.TOP, limit: number = 10) {
		this.generator = commentDataGenerator(user, sort, limit);
	}
	hasNext (): boolean {
		return this.complete;
	}
	async next (): Promise<CommentData[]> {
		const result: IteratorResult<CommentData[]> | undefined = await this.generator.next()
			.catch(e => void console.error(e));
		if (!result) {
			throw new Error("Error fetching comment page");
		}
		this.complete = result.done;
		return result.value || [];
	}
}

class CommentLinker {
	private readonly top: CommentDataIterator;
	private readonly recent: CommentDataIterator;
	private readonly comments: { [key: string]: CommentData } = {};
	constructor (user: UsernameOrKaid, limit: number = 10) {
		this.top = new CommentDataIterator(user, CommentSortType.TOP, limit);
		this.recent = new CommentDataIterator(user, CommentSortType.RECENT, limit);
	}
	getUrl (id: string): string | undefined {
		return typeof this.comments[id] === "object" ?
			`${this.comments[id].focusUrl}?qa_expand_key=${this.comments[id].expandKey}` : undefined;
	}
	getFlags (id: string) : string[] | undefined {
		return typeof this.comments[id] === "object" ? this.comments[id].flags : undefined;
	}
	getFocusId (id: string) : string | undefined {
		return typeof this.comments[id] === "object"
			? this.comments[id].focus.id : undefined;
	}
	getFocusType (id: string) : string | undefined {
		return typeof this.comments[id] === "object"
			? this.comments[id].focus.kind : undefined;
	}
	next (): Promise<void> {
		return Promise.all([this.top.next(), this.recent.next()]).then(e => flatten(e))
			.then(e => void Object.assign(this.comments, zipObject(e.map(e => e.key), e)));
	}
}

function commentsButtonEventListener (uok: UsernameOrKaid): void {
	const commentLinkGenerator: CommentLinker = new CommentLinker(uok);
	querySelectorPromise(".simple-button.discussion-list-more", 100)
		.then(button => {
			button.addEventListener("click", () => commentLinkGenerator.next());
			commentLinkGenerator.next();
			setInterval(() => {
				const unalteredComments = document.querySelectorAll(`.discussion-item.reply:not(.${EXTENSION_COMMENT_CLASSNAME})`);
				for(let i = 0; i < unalteredComments.length; i++) {
					const comment = unalteredComments[i];
					const metaControls = comment.querySelector(".discussion-meta-controls");
					const flagControls = comment.querySelector(".flag-show");
					const url = commentLinkGenerator.getUrl(comment.id);
					const flags = commentLinkGenerator.getFlags(comment.id);
					if(url && metaControls) {
						const separator = document.createElement("span");
						separator.className = "discussion-meta-separator";
						separator.textContent = "• ";
						metaControls.appendChild(separator);
						const link = document.createElement("a");
						link.href = url;
						link.target = "_blank";
						link.textContent = "Link";
						const outerSpan = document.createElement("span");
						outerSpan.appendChild(link);
						metaControls.appendChild(outerSpan);
						comment.className += ` ${EXTENSION_COMMENT_CLASSNAME}`;
					}
					if (flagControls && flags) {
						flagControls.textContent =  `${flagControls.textContent === "Flagged" ?
							"Flagged" : "Flag"} (${flags.length})`;
						flagControls.setAttribute("title", flags.join("\n"));
					}
				}
			}, 100);
		})
		.catch(console.error);
}


/** Add user interface for editing comments **/
/**
    A special thank you goes out to @MatthiasSaihttam for the comment editing functionality.
    This feature wouldn't have been possible without him
**/
function commentsAddEditLink (focusId: string, focusKind: string, element: Element) {
	// Uncomment if this feature interferes with Guardian tools
	// if(KA._userProfileData && KA._userProfileData.isModerator) { return; }

	const metaControls = element.getElementsByClassName("discussion-meta-controls")[0],
		modTools = element.getElementsByClassName("mod-tools")[0];

	if(!element || !element.className.includes("reply") || !metaControls || !modTools) { return; }

	const commentEditLink = document.createElement("a");

	const separator = document.createElement("span");
	separator.className = "discussion-meta-separator";
	separator.textContent = "• ";
	metaControls.appendChild(separator);
	commentEditLink.className = EXTENSION_COMMENT_EDIT_CLASS_PREFIX + element.id;
	commentEditLink.href = "javascript:void(0)";
	commentEditLink.textContent = "Edit";
	const outerSpan = document.createElement("span");
	outerSpan.appendChild(commentEditLink);
	metaControls.appendChild(outerSpan);

	const editCommentDiv = document.createElement("div");
	editCommentDiv.className = EXTENSION_COMMENT_EDIT_UI_CLASS;
	const textarea = document.createElement("textarea");
	textarea.className = "discussion-text open";
	textarea.style.display = "none";
	element.appendChild(textarea);

	const discussionControl = document.createElement("div");
	discussionControl.className = "discussion-controls";
	const floatRightSpan = document.createElement("span");
	floatRightSpan.className = "discussion-control float-right";
	const orDivide = document.createElement("span");
	orDivide.textContent = "or";
	const cancel = document.createElement("a");
	cancel.href = "javascript:void(0)";
	cancel.textContent = "Cancel";
	cancel.style.color = "#678d00";
	cancel.className = EXTENSION_COMMENT_CANCEL_EDIT_PREFIX + element.id;
	const editBtn = document.createElement("button");
	editBtn.className = `simple-button primary edit-comment-${element.id}-button`;
	editBtn.style.fontSize = "12px";
	editBtn.setAttribute("type", "button");
	editBtn.textContent = "Edit this comment";
	const floatrights = [floatRightSpan.cloneNode(), floatRightSpan.cloneNode(), floatRightSpan.cloneNode()];
	const correspondingElements = [cancel, orDivide, editBtn];
	for(let i = 0; i < floatrights.length; i++) {
		floatrights[i].appendChild(correspondingElements[i]);
		discussionControl.appendChild(floatrights[i]);
	}
	discussionControl.style.display = "none";
	element.appendChild(discussionControl);

	cancel.addEventListener("click", function (e) {
		const link = <HTMLElement> e.target;
		const kaencrypted = link!.className.substr(EXTENSION_COMMENT_EDIT_CLASSNAME.length);
		const parentComment = document.getElementById(kaencrypted);
		const discMeta = parentComment!.getElementsByClassName("discussion-meta")[0];
		const contentDiv = parentComment!.getElementsByClassName("discussion-content")[0];
		const textarea = parentComment!.getElementsByTagName("textarea")[0];
		const discussionControl = parentComment!.getElementsByClassName("discussion-controls")[0];
		textarea.setAttribute("style", "display: none");
		discussionControl.setAttribute("style", "display: none");
		contentDiv.setAttribute("style", "display: block");
		discMeta.setAttribute("style", "display: block");
	});

	editBtn.addEventListener("click", function (e) {
		const link = <HTMLElement> e.target;
		const kaencrypted = /edit-comment-(kaencrypted_.*?)-button/ig.exec(link.className)![1];
		const parentComment = document.getElementById(kaencrypted);
		const discMeta = parentComment!.getElementsByClassName("discussion-meta")[0];
		const contentDiv = parentComment!.getElementsByClassName("discussion-content")[0];
		const textarea = parentComment!.getElementsByTagName("textarea")[0];
		const discussionControl = parentComment!.getElementsByClassName("discussion-controls")[0];
		const x = new XMLHttpRequest();
		// Based off of @MatthiasSaihttam's bookmarklet (https://www.khanacademy.org/computer-programming/edit-comments/6039670653)
		x.open("PUT",
			`${window.location.origin}/api/internal/discussions/${focusKind}/${focusId}/comments/${kaencrypted}?casing=camel&lang=en&_=${Date.now()}`
		);
		x.setRequestHeader("x-ka-fkey", getCSRF());
		x.setRequestHeader("Content-type", "application/json");
		x.addEventListener("load", function () {
			contentDiv.textContent = KAMarkdowntoHTML(textarea.value);
			textarea.setAttribute("style", "display: none");
			discussionControl.setAttribute("style", "display: none");
			contentDiv.setAttribute("style", "display: block");
			 discMeta.setAttribute("style", "display: block");
		});
		x.addEventListener("error", function () { alert("Unable to edit comment. Please try again."); });
		x.send(JSON.stringify({ text: textarea.value }));
	});

	commentEditLink.addEventListener("click", function (e) {
		const link = <HTMLElement> e.target;
		const kaencrypted = link!.className.substr(EXTENSION_COMMENT_EDIT_CLASS_PREFIX.length);
		const parentComment = document.getElementById(kaencrypted);
		const discMeta = parentComment!.getElementsByClassName("discussion-meta")[0];
		const contentDiv = parentComment!.getElementsByClassName("discussion-content")[0];
		const content = HTMLtoKAMarkdown(contentDiv.textContent as string).trim();
		const textarea =  parentComment!.getElementsByTagName("textarea")[0];
		const discussionControl = parentComment!.getElementsByClassName("discussion-controls")[0];
		textarea.value = content;
		contentDiv.setAttribute("style", "display: none");
		discMeta.setAttribute("style", "display: none");
		textarea.setAttribute("style", "display: block");
		discussionControl.setAttribute("style", "display: block");
	});

	element.classList.add(EXTENSION_ITEM_CLASSNAME);
}

/*** When your own comments are displayed, add an edit option to them. ***/
function commentsAddEditUI (focusId: string, focusKind: string): void {
	// Old code pasted in from old version.
	// if (!KADiscussionPackage || !KADiscussionPackage.data) { return; }
	// if ((!KADiscussionPackage.data.focusId || !KADiscussionPackage.data.focusKind) && !commentLinkGenerator) { return; }

	const uneditedComments = document.querySelectorAll(`.reply:not(.${EXTENSION_ITEM_CLASSNAME})`);
	for (let i = 0; i < uneditedComments.length; i++) {
		commentsAddEditLink(focusId, focusKind, uneditedComments[i]);
	}
}

export { commentsButtonEventListener, commentsAddEditUI };
