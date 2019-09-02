import { Extension } from "./extension";
import { Program, UsernameOrKaid } from "./types/data";
import { switchToTipsAndThanks, commentsButtonEventListener } from "./discussion";
import { /*addReportButtonDiscussionPosts,*/ addProfileReportButton } from "./report";
import { addUserInfo, duplicateBadges, addProjectsLink } from "./profile";
import { addProgramInfo, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted } from "./project";
import { loadButtonMods } from "./buttons";
import { deleteNotifButtons, updateNotifIndicator } from "./notif";

class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		keyboardShortcuts(program);
		addEditorSettingsButton();
	}
	async onProgramAboutPage (program: Program) {
		const kaid = window.KA.kaid;
		loadButtonMods(program);
		addProgramInfo(program, kaid);
	}
	async onProfilePage (uok: UsernameOrKaid) {
		const kaid = window.KA.kaid;
		if (kaid) {
			addProfileReportButton(uok, kaid);
		}
		if ((uok.asUsername() && uok.asUsername() === window.KA._userProfileData!.username) || (uok.asKaid() && uok.asKaid() === kaid)) {
			setInterval(duplicateBadges, 100);
		}
		addProjectsLink(uok);
		addUserInfo(uok);
	}
	onHomePage (uok: UsernameOrKaid) {

	}
	onDiscussionPage () {
		//TODO: fix report button for discussion
		// setInterval(addReportButtonDiscussionPosts.bind(null, focusId, focusKind), 100);

		switchToTipsAndThanks();

		commentsButtonEventListener();
		console.info("On discussion page");
	}
	onHotlistPage () {
		console.info("On the hotlist");
	}
	onPage () {
		deleteNotifButtons();
		updateNotifIndicator();
	}
	onProgram404Page () {
		checkHiddenOrDeleted();
	}
}

export { ExtensionImpl };
