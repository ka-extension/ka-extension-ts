import { commentDataGenerator, CommentData } from "./util/api-util";
import { UsernameOrKaid, CommentSortType } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { buildQuery } from "./util/text-util";
import flatten from "lodash.flatten";
import zipObject from "lodash.zipobject";
import { EXTENSION_COMMENT_CLASSNAME } from "./types/names";

class CommentDataIterator {
    private complete: boolean = false;
    private readonly generator: AsyncIterator<CommentData[]>;
    constructor(user: UsernameOrKaid, sort: CommentSortType = CommentSortType.TOP, limit: number = 10) {
        this.generator = commentDataGenerator(user, sort, limit);
    }
    hasNext(): boolean {
        return this.complete;
    }
    async next(): Promise<CommentData[]> {
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
    constructor(user: UsernameOrKaid, limit: number = 10) {
        this.top = new CommentDataIterator(user, CommentSortType.TOP, limit);
        this.recent = new CommentDataIterator(user, CommentSortType.RECENT, limit);
    }
    getUrl(id: string): string | undefined {
        return typeof this.comments[id] == "object" ? 
            `${this.comments[id].focusUrl}?qa_expand_key=${this.comments[id].expandKey}` : undefined;
    }
    next(): Promise<void> {
        return Promise.all([this.top.next(), this.recent.next()]).then(e => flatten(e))
            .then(e => void Object.assign(this.comments, zipObject(e.map(e => e.key), e)))
    }
}

function commentsButtonEventListener(uok: UsernameOrKaid): void {
    const commentLinkGenerator: CommentLinker = new CommentLinker(uok);
    querySelectorPromise(".simple-button.discussion-list-more", 100)
        .then(button => {
            button.addEventListener("click", () => commentLinkGenerator.next())
            commentLinkGenerator.next();
            setInterval(() => {
                var unalteredComments = document.querySelectorAll(`.discussion-item.reply:not(.${EXTENSION_COMMENT_CLASSNAME})`);
                for(let i = 0; i < unalteredComments.length; i++) {
                    let comment = unalteredComments[i];
                    let url = commentLinkGenerator.getUrl(comment.id);
                    if(url) {
                        let metaControls = comment.getElementsByClassName("discussion-meta-controls")[0];
                        if(!metaControls) { continue; }
                        let separator = document.createElement("span");
                        separator.className = "discussion-meta-separator";
                        separator.textContent = "• ";
                        metaControls.appendChild(separator);
                        let link = document.createElement("a");
                        link.href = url;
                        link.textContent = "Link";
                        let outerSpan = document.createElement("span");
                        outerSpan.appendChild(link);
                        metaControls.appendChild(outerSpan);
                        comment.className += ` ${EXTENSION_COMMENT_CLASSNAME}`;
                    }
                }
            }, 100);
        })
        .catch(console.error);
}

export { commentsButtonEventListener }