import { UsernameOrKaid, Scratchpads, OldScratchpad, UserProfileData } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getJSON, getUserData } from "./util/api-util";
import { formatDate } from "./util/text-util";
import { DEVELOPERS, EXTENSION_ITEM_CLASSNAME } from "./types/names";

let cachedUser: UserProfileData | null = null;

async function addUserInfo (uok: UsernameOrKaid): Promise<void> {
	const userEndpoint = `${window.location.origin}/api/internal/user`;

	const User = cachedUser || await getUserData(uok);
	cachedUser = User;

	const Scratchpads = await getJSON(`${userEndpoint}/scratchpads?kaid=${User.kaid}&limit=1000`, {
		scratchpads: [{
			url: 1,
			sumVotesIncremented: 1,
			spinoffCount: 1
		}]
	}, true) as Scratchpads;

	const first = Scratchpads.scratchpads[0];
	if (first) {
		const url = window.location.origin +
			"/api/internal/show_scratchpad?scratchpad_id=" +
			first.url.split("/")[5];

		Promise.all([
			querySelectorPromise(
				".user-info.clearfix",
				10, 500
			),
			getJSON(url, {
				creatorProfile: {
					backgroundSrc: 1
				}
			}, true)
		]).then(res => {
			const [bg, req] = res;

			const backgroundUrl = (req as OldScratchpad).creatorProfile.backgroundSrc;

			const name = document.querySelector(".user-deets > div > div"),
				bio = document.querySelector(".user-deets > div > span");

			if (backgroundUrl && name && bio) {
				const style =
						`background-image: url("${backgroundUrl}");` +
						"background-position: center;" +
						"background-size: cover;",
					textStyle = "color: #FFFFFF;";

				if (backgroundUrl && name && bio) {
					bg.setAttribute("style", style);
					name.setAttribute("style", textStyle);
					bio.setAttribute("style", textStyle);
				}
			}
		}).catch(console.error);
	}

	//TODO: Never fires and we don't get info if the user has thier statistics hidden
	const table = await querySelectorPromise(".user-statistics-table > tbody") as HTMLElement;

	if (table.classList.contains(EXTENSION_ITEM_CLASSNAME)) {
		return;
	}

	const totals = Scratchpads.scratchpads.reduce((current, scratch) => {
		current.votes += scratch.sumVotesIncremented - 1;
		current.spinoffs += scratch.spinoffCount;
		current.inspiration += scratch.spinoffCount > 0 ? 1 : 0;
		return current;
	}, { programs: Scratchpads.scratchpads.length, votes: 0, spinoffs: 0, inspiration: 0 });

	const averageSpinoffs = Math.round(totals.spinoffs / totals.programs || 0);
	const averageVotes = Math.round(totals.votes / totals.programs || 0);

	const entries = {
		"Programs": totals.programs,
		"Total votes received": totals.votes,
		"Total spinoffs received": totals.spinoffs,
		"Average votes received": averageVotes,
		"Average spinoffs received": averageSpinoffs,
		"Total badges": "Undisclosed",
		"Forked programs": totals.inspiration,
	} as { [key: string]: string | number; };

	for (const entry in entries) {
		table.innerHTML += `<tr>
				<td class="user-statistics-label">${entry}</td>
				<td>${entries[entry]}</td>
			</tr>`;
	}

	const cells = table.getElementsByTagName("td");

	const dateElement = cells[1];
	dateElement!.title = formatDate(User.joined);

	const videoCountElement = cells[5];
	videoCountElement!.innerText = (User.countVideosCompleted).toString();

	table.classList.add(EXTENSION_ITEM_CLASSNAME);

	querySelectorAllPromise(".badge-category-count", 10, 500)
		.then(badges => {
			cells[17].innerText = (Array.from(badges).reduce((prev, badge): number => {
				return prev + (parseInt(badge.textContent || "") || 0);
			}, 0) || 0).toString();
		}).catch(console.error);

	if (DEVELOPERS.includes(User.kaid)) {
		table.innerHTML += `<div class="kae-green user-statistics-label">KA Extension Developer</div>`;
	}
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
	const badgeDescription = badges.find(element => element.children[0].textContent === badge)!.querySelector(".achievement-desc")!
	badgeDescription.textContent = description;
	badgeDescription.parentElement!.parentElement!.parentElement!.title = description;
}
function setBadgeDescriptions (): void {
	const badges = Array.from(document.querySelectorAll('#category-DIAMOND>.user-owned-container>div>div>.badge-link>.achievement-badge>#outline-box>.achievement-text'))
	setBadgeDescription(badges, "Atlas", ATLAS_DESCRIPTION);
	setBadgeDescription(badges, "Artemis", ARTEMIS_DESCRIPTION);
	setBadgeDescription(badges, "Tesla", TESLA_DESCRIPTION);
}
function setSpotlightBadgeDescription (description: string): void {
	const element = document.querySelector("div[data-test-id=badge-spotlight]>div>div:nth-child(2)>span")
	element!.textContent = description
}
function addBadgeInfo (url: Array<string>): void {
	if (url[3] === "profile") {
		querySelectorAllPromise(".inset-container").then(_badgesContainer => {
			setBadgeDescriptions();
		}).catch(console.error);
	} else if (url[3] === "badges") {
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
