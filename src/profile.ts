import { UsernameOrKaid, UserProfileData } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getOldScratchpad } from "./util/api-util";
import { getUserData, getUserScratchpads } from "./util/graphql-util";
import { formatDate } from "./util/text-util";
import { DEVELOPERS, EXTENSION_ITEM_CLASSNAME } from "./types/names";

let cachedUser: UserProfileData | null = null;

async function addUserInfo (uok: UsernameOrKaid): Promise<void> {
	const User = cachedUser || await getUserData(uok);
	cachedUser = User;

	const scratchpads = getUserScratchpads({
		kaid: cachedUser.kaid, pages: 5, limit: 100,
	});

	let programCount = 0, inspirations = 0,
		votes = 0, spinoffs = 0;
	for await (const page of scratchpads) {
		for (const s of page) {
			programCount++;
			spinoffs += s.displayableSpinoffCount;
			inspirations += s.displayableSpinoffCount > 0 ? 1 : 0;
			votes += s.sumVotesIncremented;
		}
	}

	//TODO: Never fires and we don't get info if the user has their statistics hidden
	const table = await querySelectorPromise(".user-statistics-table > tbody") as HTMLElement;

	if (table.classList.contains(EXTENSION_ITEM_CLASSNAME)) {
		return;
	}

	const averageSpinoffs = Math.round(spinoffs / programCount || 0);
	const averageVotes = Math.round(votes / programCount || 0);

	const entries = {
		"Programs": programCount,
		"Total votes received": votes,
		"Total spinoffs received": spinoffs,
		"Average votes received": averageVotes,
		"Average spinoffs received": averageSpinoffs,
		"Total badges": "Undisclosed",
		"Forked programs": inspirations,
	} as { [key: string]: string | number; };

	for (const [key, val] of Object.entries(entries)) {
		const row = document.createElement("tr"),
			label = document.createElement("td"),
			value = document.createElement("td");

		label.className = "user-statistics-label";
		label.textContent = key;
		value.textContent = val.toString();

		row.appendChild(label);
		row.appendChild(value);

		table.appendChild(row);
	}

	const cells = table.getElementsByTagName("td");

	const dateElement = cells[1];
	dateElement!.title = formatDate(User.joined);

	const videoCountElement = cells[5];
	videoCountElement!.innerText = (User.countVideosCompleted).toString();

	table.classList.add(EXTENSION_ITEM_CLASSNAME);

	if (DEVELOPERS.includes(User.kaid)) {
		table.innerHTML += `<div class="kae-green user-statistics-label">Extension Developer</div>`;
	}

	querySelectorAllPromise(".badge-category-count", 10, 500)
		.then(badges => {
			const badgeCount = Array.from(badges)
				.reduce((prev, badge): number => {
					return prev + (parseInt(badge.textContent || "") || 0);
				}, 0);
			cells[17].textContent = badgeCount.toString();
		}).catch(console.error);
}

//TODO: Fix or report to KA, currently disabled
function duplicateBadges (): void {
	const usedBadges = document.getElementsByClassName("used");
	if (usedBadges.length > 0) {
		for (let i = 0; i < usedBadges.length; i++) {
			usedBadges[i].classList.remove("used");
		}
	}
}

//TODO: Doesn't fire if switching from one profile page to another
//e.g: Opening khanacademy.com or clicking "Learner Home" to go to your own profile when on someone else's profile
function addProjectsLink (uok: UsernameOrKaid): void {
	querySelectorPromise("nav[data-test-id=\"side-nav\"] section:last-child ul").then(sidebarLinks => {
		const check = document.getElementsByClassName("kae-projects-profile-link");

		//If we're on the projects page already, don't worry about adding it
		if (window.location.pathname.indexOf("projects") === -1 && check.length === 0) {
			let profileLink = document.querySelector("nav[data-test-id=\"side-nav\"] a[data-test-id=\"side-nav-profile\"]") as HTMLElement;
			console.log(profileLink.textContent);
			if (!profileLink || !profileLink.parentElement) {
				throw new Error("Failed to find profile element");
			}
			profileLink = profileLink.parentElement;

			profileLink.style.color = "red";

			const projectsLink = document.createElement("a");

			projectsLink.innerText = "Projects";
			projectsLink.href = `/profile/${uok}/projects`;
			projectsLink.classList.add("kae-projects-profile-link");

			profileLink.appendChild(projectsLink);
		}
	}).catch(console.error);
}

const ATLAS_DESCRIPTION = `Achieve mastery in ${(5000).toLocaleString()} unique skills`;
const ARTEMIS_DESCRIPTION = `Achieve mastery in ${(7500).toLocaleString()} unique skills`;
const TESLA_DESCRIPTION = `Earn ${(10_000_000).toLocaleString()} energy points`;

function setBadgeDescription (badges: Element[], badge: string, description: string): void {
	const badgeDescription = badges.find(element => element.children[0].textContent === badge)!.querySelector(".achievement-desc")!;
	badgeDescription.textContent = description;
	badgeDescription.parentElement!.parentElement!.parentElement!.title = description;
}
function setBadgeDescriptions (): void {
	const badges = Array.from(document.querySelectorAll("#category-DIAMOND>.user-owned-container>div>div>.badge-link>.achievement-badge>#outline-box>.achievement-text"));
	setBadgeDescription(badges, "Atlas", ATLAS_DESCRIPTION);
	setBadgeDescription(badges, "Artemis", ARTEMIS_DESCRIPTION);
	setBadgeDescription(badges, "Tesla", TESLA_DESCRIPTION);
}
function setSpotlightBadgeDescription (description: string): void {
	const element = document.querySelector("div[data-test-id=badge-spotlight]>div>div:nth-child(2)>span");
	element!.textContent = description;
}
function addBadgeInfo (url: Array<string>): void {
	if (url[0] === "profile") {
		querySelectorAllPromise(".inset-container").then(_badgesContainer => {
			setBadgeDescriptions();
		}).catch(console.error);
	} else if (url[0] === "badges") {
		querySelectorAllPromise(".inset-container, div[data-test-id=badge-spotlight]").then(_badgesContainer => {
			setBadgeDescriptions();
			switch (url[4]) {
				case "atlas":
					setSpotlightBadgeDescription(ATLAS_DESCRIPTION);
					break;
				case "artemis":
					setSpotlightBadgeDescription(ARTEMIS_DESCRIPTION);
					break;
				case "tesla":
					setSpotlightBadgeDescription(TESLA_DESCRIPTION);
					break;
			}
		}).catch(console.error);
	}
}

export { addUserInfo, duplicateBadges, addProjectsLink, addBadgeInfo };
