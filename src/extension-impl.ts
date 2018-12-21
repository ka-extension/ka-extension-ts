import { Extension, getKaid } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { commentsButtonEventListener, commentsAddEditUI } from "./comment-data";
import { addProgramFlags } from "./flag";
import { addReportButton, addReportButtonDiscussionPosts, addProfileReportButton } from "./report";
import { addUserInfo, addLocationInput } from "./profile";
import { addProgramInfo, hideEditor, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted, addProgramAuthorHoverCard } from "./project";
import { addLinkButton, replaceVoteButton } from "./buttons";
import { deleteNotifButtons, updateNotifIndicator } from "./notif";

class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		hideEditor(program);
		keyboardShortcuts(program);
		addProgramAuthorHoverCard(program);
		addEditorSettingsButton();
	}
	async onProgramAboutPage (program: Program) {
		const kaid = await getKaid() as string;
		addReportButton(program, kaid);
		addProgramInfo(program, kaid);
		addProgramFlags(program, kaid);
		addLinkButton(program);
		replaceVoteButton(program);
	}
	async onRepliesPage (uok: UsernameOrKaid) {
		const kaid = await getKaid();
		commentsButtonEventListener(uok, kaid);
		console.info("On replies page");
	}
	async onProfilePage (uok: UsernameOrKaid) {
		const kaid = await getKaid();
		if (kaid) {
			addProfileReportButton(uok, kaid);
		}
		addUserInfo(uok);
	}
	onHomePage (uok: UsernameOrKaid) {
		addLocationInput(uok);
	}
	onDetailedDiscussionPage (focusId: string, focusKind: string) {
		setInterval(addReportButtonDiscussionPosts.bind(null, focusId, focusKind), 100);
		setInterval(commentsAddEditUI.bind(null, focusId, focusKind), 100);
		console.info("On detailed discussion page");
	}
	onHotlistPage () {
		console.info("On the hotlist");
	}
	onPage () {
		deleteNotifButtons();
		updateNotifIndicator();
	}
	onNewProgramPage () {
		addEditorSettingsButton();
	}
	onProgram404Page () {
		checkHiddenOrDeleted();
	}
}

export { ExtensionImpl };
