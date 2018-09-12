import { Extension, getKaid } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { commentsButtonEventListener, commentsAddEditUI } from "./comment-data";
import { addProgramFlags } from "./flag";
import { addReportButton, addReportButtonDiscussionPosts, addProfileReportButton } from "./report";
import { addUserInfo, addLocationInput } from "./profile";
import { addProgramDates, hideEditor, keyboardShortcuts } from "./project";
import { deleteNotifButtons, updateNotifIndicator } from "./notif";


class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		const kaid = await getKaid();
		addProgramFlags(program, kaid || "");
		addProgramDates(program, kaid || "");
		if (kaid) {
			addReportButton(program, kaid);
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
	async onProfilePage (uok: UsernameOrKaid) {
		const kaid = await getKaid();
		if (kaid) {
			addProfileReportButton(uok, kaid);
		}
		addUserInfo(uok);
		addLocationInput(uok);
	}
	onHotlistPage () {
		console.info("On the hotlist");
	}
	onPage () {
		deleteNotifButtons();
		updateNotifIndicator();
	}
}

export { ExtensionImpl };
