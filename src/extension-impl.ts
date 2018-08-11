import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { commentsButtonEventListener, commentsAddEditUI } from "./comment-data";
import { addProgramFlags } from "./flag";
import { addReportButton, addReportButtonDiscussionPosts, addProfileReportButton } from "./report";
import { addUserInfo, addLocationInput } from "./profile";
import { addProgramDates, hideEditor, keyboardShortcuts } from "./project";
import { deleteNotifButtons } from "./notif";


class ExtensionImpl extends Extension {
	onProgramPage (program: Program) {
		addProgramFlags(program, this.kaid ? this.kaid : "");
		addProgramDates(program, this.kaid ? this.kaid : "");
		if (this.kaid) {
			addReportButton(program, this.kaid);
		}
		hideEditor(program);
		keyboardShortcuts(program);
	}
	onDetailedDiscussionPage (focusId: string, focusKind: string) {
		setInterval(addReportButtonDiscussionPosts.bind(null, focusId, focusKind), 100);
		setInterval(commentsAddEditUI.bind(null, focusId, focusKind), 100);
		console.log("On detailed discussion page");
	}
	onRepliesPage (uok: UsernameOrKaid) {
		commentsButtonEventListener(uok);
		console.log("On replies page");
	}
	onProfilePage (uok: UsernameOrKaid) {
		if (this.kaid) {
			addProfileReportButton(uok, this.kaid);
		}
		addUserInfo(uok);
		addLocationInput(uok);
	}
	onHotlistPage () {
		console.info("On the hotlist");
	}
	onPage () {
		deleteNotifButtons();
	}
}

export { ExtensionImpl };
