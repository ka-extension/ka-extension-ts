import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { switchToTipsAndThanks, commentsButtonEventListener, updateComments } from "./discussion";
import { addUserInfo, addProjectsLink, addBadgeInfo } from "./profile";
import { addProgramInfo, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted } from "./project";
import { loadButtonMods } from "./buttons";
import { getKAID } from "./util/data-util";
import { Message, MessageTypes } from "./types/message-types";

class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		this.callOnce(addEditorSettingsButton, program);
		this.callOnce(keyboardShortcuts, program);
	}
	async onProgramAboutPage (program: Program) {
		const kaid = getKAID();
		addProgramInfo(program, kaid);
		loadButtonMods(program);
	}
	async onProfilePage (uok: UsernameOrKaid) {
		addProjectsLink(uok);
		addUserInfo(uok);
	}
	onHomePage (uok: UsernameOrKaid) {}
	async onBadgesPage () {
		addBadgeInfo(this.url);
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
	handler (m: Message) {
		if (m.type === MessageTypes.PAGE_UPDATE) {
			this.init();
		}
	}
}

export { ExtensionImpl };
