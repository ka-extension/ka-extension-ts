import { Extension } from "./extension";
import { Program, UsernameOrKaid, KA } from "./types/data";
import { switchToTipsAndThanks, commentsButtonEventListener } from "./discussion";
import { addProgramFlags } from "./flag";
import { addReportButton, /*addReportButtonDiscussionPosts,*/ addProfileReportButton } from "./report";
import { addUserInfo, duplicateBadges, } from "./profile";
import { addProgramInfo, hideEditor, keyboardShortcuts, addEditorSettingsButton, checkHiddenOrDeleted, addProgramAuthorHoverCard } from "./project";
import { addLinkButton, replaceVoteButton } from "./buttons";
import { deleteNotifButtons, updateNotifIndicator } from "./notif";

class ExtensionImpl extends Extension {
	async onProgramPage (program: Program) {
		hideEditor(program);
		keyboardShortcuts(program);
		addEditorSettingsButton();
	}
	async onProgramAboutPage (program: Program) {
		const kaid = window.KA.kaid;
		addReportButton(program, kaid);
		addProgramInfo(program, kaid);
		addProgramFlags(program, kaid);
		addLinkButton(program);
		replaceVoteButton(program);
		addProgramAuthorHoverCard(program);
	}
	async onProfilePage (uok: UsernameOrKaid) {
		const kaid = window.KA.kaid;
		if (kaid) {
			addProfileReportButton(uok, kaid);
		}
		if ((uok.asUsername() && uok.asUsername() === window.KA._userProfileData!.username) || (uok.asKaid() && uok.asKaid() === kaid)) {
			setInterval(duplicateBadges, 100);
		}
		addUserInfo(uok);
	}
	onHomePage (uok: UsernameOrKaid) {
		console.info("On home page");
	}
	onDiscussionPage (uok: UsernameOrKaid) {
		//TODO: fix report button for discussion
		// setInterval(addReportButtonDiscussionPosts.bind(null, focusId, focusKind), 100);

		switchToTipsAndThanks();

		commentsButtonEventListener(uok);
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
