import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./data";
import { commentsButtonEventListener } from "./comment-data";

class ExtensionImpl extends Extension {
    onProgramPage(program: Program) {
        console.log(program);
    }
    async onRepliesPage(uok: UsernameOrKaid) {
        commentsButtonEventListener(uok);
    }
}

export { ExtensionImpl };