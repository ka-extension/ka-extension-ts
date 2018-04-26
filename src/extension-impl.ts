import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./data";
import { commentsButtonEventListener } from "./comment-data";
import { addProgramFlags } from "./flag";

class ExtensionImpl extends Extension {
    onProgramPage(program: Program) {
        addProgramFlags(program, this.kaid);
    }
    async onRepliesPage(uok: UsernameOrKaid) {
        commentsButtonEventListener(uok);
    }
}

export { ExtensionImpl };
