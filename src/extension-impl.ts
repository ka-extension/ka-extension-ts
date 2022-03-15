import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { switchToTipsAndThanks, commentsButtonEventListener, updateComments } from "./discussion";
import { addUserInfo, addProjectsLink, addBadgeInfo } from "./profile";
import { addProgramInfo, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted } from "./project";
import { loadButtonMods } from "./buttons";
// import { deleteNotifButtons } from "./notif";
import { getKAID } from "./util/data-util";

class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		keyboardShortcuts(program);
		addEditorSettingsButton();
	}
	async onProgramAboutPage (program: Program) {
		const kaid = getKAID();
		loadButtonMods(program);
		addProgramInfo(program, kaid);
	}
	async onProfilePage (uok: UsernameOrKaid) {
		addProjectsLink(uok);
		addUserInfo(uok);
	}
	onHomePage (uok: UsernameOrKaid) {

	}
	async onBadgesPage (url: Array<string>) {
		addBadgeInfo(url);
	}
	onDiscussionPage () {
		switchToTipsAndThanks();
		commentsButtonEventListener();
		console.info("On discussion page");
	}
	onHotlistPage () {
		console.info("On the hotlist");
	}
	onPage () {
		updateComments();
		// deleteNotifButtons();
	}
	onProgram404Page () {
		checkHiddenOrDeleted();
	}
}

export { ExtensionImpl };
