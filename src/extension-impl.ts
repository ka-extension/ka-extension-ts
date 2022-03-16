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
		if (this.first) {
			keyboardShortcuts(program);
			addEditorSettingsButton();
		}
	}
	async onProgramAboutPage (program: Program) {
		if (this.first) {
			const kaid = getKAID();
			loadButtonMods(program);
			addProgramInfo(program, kaid);
		}
	}
	async onProfilePage (uok: UsernameOrKaid) {
		if (this.first) {
			addProjectsLink(uok);
		}
		addUserInfo(uok);
	}
	onHomePage (uok: UsernameOrKaid) {

	}
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
