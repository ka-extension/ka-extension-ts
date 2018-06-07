import { UsernameOrKaid, Scratchpads, UserLocation, UserProfileData } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getJSON } from "./util/api-util";
import { formatDate } from "./util/text-util";
import { getCSRF } from "./util/cookie-util";

function addUserInfo (uok: UsernameOrKaid): void {
	function tableElement (title: string, value: string): string {
		return `<tr>
                    <td class="user-statistics-label">${title}</td>
                    <td>${value}</td>
                </tr>`;
	}

	querySelectorPromise(".user-statistics-table > tbody")
	.then(table => table as HTMLElement)
	.then(table => {

			getJSON(`${window.location.origin}/api/internal/user/scratchpads?username=${uok.id}&limit=1000`, {
				scratchpads: [{
					sumVotesIncremented: 1,
					spinoffCount: 1
				}]
			})
			.then(data => data as Scratchpads)
			.then(Scratchpads => {
				const totals = Scratchpads.scratchpads.reduce((totals, scratchpad) => {
					totals.votes += scratchpad.sumVotesIncremented - 1;
					totals.spinoffs += scratchpad.spinoffCount;
					return totals;
				}, { programs: Scratchpads.scratchpads.length, votes: 0, spinoffs: 0 });
				const averageSpinoffs = Math.round(totals.spinoffs / totals.programs || 0).toString();
				const averageVotes = Math.round(totals.votes / totals.programs || 0).toString();
				table.innerHTML += tableElement("Total votes received", totals.votes.toString());
				table.innerHTML += tableElement("Total spinoffs received", totals.spinoffs.toString());
				table.innerHTML += tableElement("Average votes received", averageVotes);
				table.innerHTML += tableElement("Average spinoffs received", averageSpinoffs);
				table.innerHTML += tableElement("Programs", totals.programs.toString());
			}).catch(console.error);

			getJSON(`${window.location.origin}/api/internal/user/profile?username=${uok.id}`, {
				dateJoined: 1,
				kaid: 1
			})
			.then(data => data as UserProfileData)
			.then(data => {
				table.innerHTML += tableElement("Date joined", formatDate(data.dateJoined));
				table.innerHTML += tableElement("User kaid", data.kaid);
			}).catch(console.error);

			querySelectorAllPromise(".badge-category-count", 10, 200)
			.then(badgeList => badgeList as HTMLCollection)
			.then(badgeList => {
				if (badgeList.length < 6) { return; }
				const badges: Element[] = Array.from(badgeList);
				const total: number = badges.reduce((prev, badge): number => {
					if (badge.textContent) {
						return prev + parseInt(badge.textContent);
					}
					return prev;
				}, 0);
				table.innerHTML += tableElement("Total Badges", total.toString());
			}).catch(console.error);

	}).catch(console.error);

}

function addLocationInput (uok: UsernameOrKaid): void {
	getJSON(`${window.location.origin}/api/internal/user/profile?username=${uok}`, {
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
			const locationInput: HTMLInputElement = <HTMLInputElement> document.createElement("input");
			locationInput.type = "text";
			locationInput.id = "kae-location-input";
			locationInput.value = locationData.displayText;
			if(locationElement.parentNode){
				locationElement.parentNode.replaceChild(locationInput, locationElement);
			}

			const submitButton: HTMLAnchorElement = <HTMLAnchorElement> document.querySelectorAll(".modal-footer .kui-button")[1];
			submitButton.addEventListener("click", e => {
				const bioLocation: HTMLDivElement = <HTMLDivElement> document.querySelector(".location-text");
				bioLocation.textContent = locationInput.value;
				setTimeout(() => {
					const userKey = (window as any).KA._userProfileData.userKey;

					const req: XMLHttpRequest = <XMLHttpRequest> new XMLHttpRequest();
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

			const privacyIndicator: HTMLDivElement = <HTMLDivElement> document.getElementById("edit-profile-privacy-indicator");
			if(privacyIndicator.parentNode){
				privacyIndicator.parentNode.removeChild(privacyIndicator);
			}
		}).catch(console.error);
	}).catch(console.error);
}

export { addUserInfo, addLocationInput };
