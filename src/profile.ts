import { UsernameOrKaid, Scratchpads, UserLocation, UserProfileData } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getJSON } from "./util/api-util";
import { formatDate } from "./util/text-util";
import { getCSRF } from "./util/cookie-util";

async function addUserInfo (uok: UsernameOrKaid): Promise<void> {
	const userEndpoint = `${window.location.origin}/api/internal/user`;

	const Scratchpads = await getJSON(`${userEndpoint}/scratchpads?${uok.type}=${uok.id}&limit=1000`, {
		scratchpads: [{
			sumVotesIncremented: 1,
			spinoffCount: 1
		}]
	}) as Scratchpads;

	const table = await querySelectorPromise(".user-statistics-table > tbody") as HTMLElement;

	const totals = Scratchpads.scratchpads.reduce((current, scratch) => {
		current.votes += scratch.sumVotesIncremented - 1;
		current.spinoffs += scratch.spinoffCount;
		current.inspiration += scratch.spinoffCount > 0 ? 1 : 0;
		return current;
	}, { programs: Scratchpads.scratchpads.length, votes: 0, spinoffs: 0, inspiration: 0 });

	const averageSpinoffs = Math.round(totals.spinoffs / totals.programs || 0);
	const averageVotes = Math.round(totals.votes / totals.programs || 0);

	const badges = await querySelectorAllPromise(".badge-category-count", 10, 500);
	const totalBadges = Array.from(badges).reduce((prev, badge): number => {
		return prev + (parseInt(badge.textContent || "") || 0);
	}, 0) || 0;

	const entries: any = {
		"Programs": totals.programs,
		"Total votes received": totals.votes,
		"Total spinoffs received": totals.spinoffs,
		"Average votes received": averageVotes,
		"Average spinoffs received": averageSpinoffs,
		"Total badges": totalBadges,
		"Inspiration badges": totals.inspiration,
		"More info": `<a href="${userEndpoint}/profile?${uok.type}=${uok.id}&format=pretty" target="_blank">Api endpoint</a>`
	};

	for (const entry in entries) {
		table.innerHTML += `<tr>
				<td class="user-statistics-label">${entry}</td>
				<td>${entries[entry]}</td>
			</tr>`;
	}

	getJSON(`${userEndpoint}/profile?${uok.type}=${uok.id}`, {
		dateJoined: 1
	})
		.then(data => data as UserProfileData)
		.then(User => {
			const dateElement = document.querySelectorAll("td")[1];
			dateElement!.title = formatDate(User.dateJoined);
		});

}

function addLocationInput (uok: UsernameOrKaid): void {
	getJSON(`${window.location.origin}/api/internal/user/profile?${uok.type}=${uok}`, {
		userLocation: 1
	})
		.then(userData => userData as UserProfileData)
		.then(userData => userData.userLocation as UserLocation)
		.then(locationData => {
			console.log(locationData);
			querySelectorPromise("#s2id_autogen1")
				.then(locationElement => locationElement as HTMLDivElement)
				.then(locationElement => {
					console.log(locationElement);
					const locationInput: HTMLInputElement = <HTMLInputElement>document.createElement("input");
					locationInput.type = "text";
					locationInput.id = "kae-location-input";
					locationInput.value = locationData.displayText;

					const parent = locationElement.parentNode as HTMLDivElement;
					parent.replaceChild(locationInput, locationElement);

					const submitButton: HTMLAnchorElement = <HTMLAnchorElement>document.querySelectorAll(".modal-footer button")[1];
					submitButton.addEventListener("click", e => {
						const bioLocation: HTMLDivElement = <HTMLDivElement>document.querySelector(".location-text");
						bioLocation.textContent = locationInput.value;
						setTimeout(() => {
							const userKey = (window as any).KA._userProfileData.userKey;

							const req: XMLHttpRequest = <XMLHttpRequest>new XMLHttpRequest();
							req.open("POST", `${window.location.origin}/api/internal/user/profile`);
							req.setRequestHeader("x-ka-fkey", getCSRF());
							req.setRequestHeader("content-type", "application/json");
							req.send(JSON.stringify({
								userKey: userKey,
								userLocation: {
									displayText: bioLocation.textContent
								}
							}));
						}, 500);
					});

					const privacy: HTMLDivElement = <HTMLDivElement>document.getElementById("edit-profile-privacy-indicator");
					privacy.parentNode && privacy.parentNode.removeChild(privacy);
				}).catch(console.error);
		}).catch(console.error);
}

function duplicateBadges (): void {
	const usedBadges = document.getElementsByClassName("used");
	if (usedBadges.length > 0) {
		for (let i = 0; i < usedBadges.length; i++) {
			usedBadges[i].classList.remove("used");
		}
	}
}

export { addUserInfo, addLocationInput, duplicateBadges };
