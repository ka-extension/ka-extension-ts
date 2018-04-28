import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./data";
import { commentsButtonEventListener } from "./comment-data";
import { addProgramFlags } from "./flag";
import { addReportButton } from "./report";
import { addUserInfo } from "./profile";
import { addProgramDates } from "./project";


class ExtensionImpl extends Extension {
    onProgramPage(program: Program) {
        addProgramFlags(program, this.kaid);
        addReportButton(program, this.kaid);
        addProgramDates(program, this.kaid);
    }
    async onRepliesPage(uok: UsernameOrKaid) {
        commentsButtonEventListener(uok);
    }
    onProfilePage(uok: UsernameOrKaid) {
      addUserInfo(uok);
    }
    onHotlistPage() {
      console.info("On the hotlist");
    }
}

export { ExtensionImpl };
