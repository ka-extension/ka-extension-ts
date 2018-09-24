import { Extension, getKaid } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { commentsButtonEventListener, commentsAddEditUI } from "./comment-data";
import { addProgramFlags } from "./flag";
import { addReportButton, addReportButtonDiscussionPosts, addProfileReportButton } from "./report";
import { addUserInfo, addLocationInput } from "./profile";
import { addProgramDates, hideEditor, keyboardShortcuts, darkToggleButton, replaceVoteButton } from "./project";
import { deleteNotifButtons, updateNotifIndicator } from "./notif";

class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		const kaid = await getKaid();
		addProgramFlags(program, kaid || "");
		addProgramDates(program, kaid || "");
		replaceVoteButton(program);
		if (kaid) {
			addReportButton(program, kaid);
		}
		hideEditor(program);
		keyboardShortcuts(program);
		darkToggleButton();
	}
	onDetailedDiscussionPage (focusId: string, focusKind: string) {
		setInterval(addReportButtonDiscussionPosts.bind(null, focusId, focusKind), 100);
		setInterval(commentsAddEditUI.bind(null, focusId, focusKind), 100);
		console.log("On detailed discussion page");
	}
	async onRepliesPage (uok: UsernameOrKaid) {
		const kaid = await getKaid();
		commentsButtonEventListener(uok, kaid);
		console.log("On replies page");
	}
	async onProfilePage (uok: UsernameOrKaid) {
		const kaid = await getKaid();
		if (kaid) {
			addProfileReportButton(uok, kaid);
		}
		addUserInfo(uok);
	}
	async onHomePage (uok: UsernameOrKaid) {
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
