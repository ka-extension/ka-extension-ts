import { UsernameOrKaid, Scratchpads, UserProfileData } from "./data";
import { querySelectorPromise } from "./util/promise-util";
import { getJSON } from "./util/api-util";
import { formatDate } from "./util/text-util";

function addUserInfo(uok: UsernameOrKaid): void {
  function tableElement(title: string, value: string): string {
    return `<tr>
              <td class="user-statistics-label">${title}</td>
              <td>${value}</td>
            </tr>`;
  }
  getJSON(`${window.location.origin}/api/internal/user/scratchpads?username=${uok.id}&limit=1000`, {
    scratchpads: [{
      sumVotesIncremented: 1,
      spinoffCount: 1
    }]
  }).then(data => data as Scratchpads).then(Scratchpads => {
    const totals = Scratchpads.scratchpads.reduce((totals, scratchpad) => {
      totals.votes += scratchpad.sumVotesIncremented - 1;
      totals.spinoffs += scratchpad.spinoffCount;
      return totals;
    }, { programs: Scratchpads.scratchpads.length, votes: 0, spinoffs: 0 });
    const averageSpinoffs = Math.round(totals.spinoffs / totals.programs).toString(),
          averageVotes = Math.round(totals.votes / totals.programs).toString();
    querySelectorPromise(".user-statistics-table > tbody").then(table => table as HTMLElement).then(table => {
      table.innerHTML += tableElement("Programs", totals.programs.toString());
      table.innerHTML += tableElement("Total votes received", totals.votes.toString());
      table.innerHTML += tableElement("Total spinoffs received", totals.spinoffs.toString());
      table.innerHTML += tableElement("Average votes received", averageVotes);
      table.innerHTML += tableElement("Average spinoffs received", averageSpinoffs);
    }).catch(console.error);
  }).catch(console.error);

  getJSON(`${window.location.origin}/api/internal/user/profile?username=${uok.id}`, {
    dateJoined: 1,
    kaid: 1
  }).then(data => data as UserProfileData).then(data => {
    querySelectorPromise(".user-statistics-table > tbody").then(table => table as HTMLElement).then(table => {
      table.innerHTML += tableElement("Date joined", formatDate(data.dateJoined));
      table.innerHTML += tableElement("User kaid", data.kaid);
    }).catch(console.error);
  }).catch(console.error);
}

export { addUserInfo };
