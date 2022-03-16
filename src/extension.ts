import { UsernameOrKaid, Program } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";
import { ScratchpadUI } from "./types/data";
import { getKAID } from "./util/data-util";
import { Message } from "./types/message-types";

const getScratchpadUI = (): Promise<ScratchpadUI> =>
	new Promise((resolve, reject) => {
		//Give it 10 seconds, max
		let attemptsRemaining = 100;
		const check = () => {
			const ScratchpadUI = window.ScratchpadUI;
			if (ScratchpadUI && ScratchpadUI.scratchpad) {
				return resolve(ScratchpadUI);
			} else if (attemptsRemaining) {
				attemptsRemaining--;
				setTimeout(check, 100);
			} else {
				reject(new Error("Unable to load scratchpad UI."));
			}
		};
		check();
	});

abstract class Extension {
	protected url: string[];
	protected first: boolean;
	constructor () {
		this.url = window.location.href.split("/");
		this.first = true;
	}
	abstract onProgramPage (program: Program): void | Promise<void>;
	abstract onProgramAboutPage (program: Program): void | Promise<void>;
	abstract onHotlistPage (): void;
	abstract onProfilePage (uok: UsernameOrKaid): void;
	abstract onHomePage (uok: UsernameOrKaid): void;
	abstract onBadgesPage (): void;
	abstract onPage (): void;
	abstract onProgram404Page (): void;
	abstract onDiscussionPage (): void;
	abstract handler (m: Message): void;
	register () {
		window.addEventListener("message", e => {
			const message: Message = e.data;
			if (e.source === window) {
				this.handler(message);
			}
		});
	}
	async init (): Promise<void> {
		if (window.location.host.includes("khanacademy.org")) {
			this.url = window.location.href.split("/");

			this.onPage();

			const kaid = getKAID();

			//Check for discussion page, 10 seconds max. (Element isn't used, just used to check for discussion page)
			querySelectorPromise("[data-test-id=\"discussion-tab\"]", 100, 100).then (_ =>
				this.onDiscussionPage()
			).catch(console.warn);

			getScratchpadUI().then(ScratchpadUI => {
				const programData = ScratchpadUI.scratchpad.attributes;
				this.onProgramPage(programData);
				this.onProgramAboutPage(programData);
				querySelectorPromise("#scratchpad-tabs").then(tabs => {
					tabs.childNodes[0].addEventListener("click", (e: Event) => {
						if ((e.currentTarget as HTMLAnchorElement).getAttribute("aria-selected") !== "true") {
							this.onProgramAboutPage(programData);
						}
					});
				});
			}).catch(console.warn);

			if (/^\d{10,16}/.test(this.url[5])) {
				querySelectorPromise("#page-container-inner", 100)
					.then(pageContent => pageContent as HTMLDivElement)
					.then(pageContent => {
						if (pageContent.querySelector("#four-oh-four")) {
							window.$LAB.queueWait(() => {
								this.onProgram404Page();
							});
						}
					}).catch(console.error);
			}

			if (this.url[5] === "browse") {
				this.onHotlistPage();
			}

			if (this.url[3] === "profile" && !this.url[6]) {
				const identifier: UsernameOrKaid = new UsernameOrKaid(this.url[4]);
				this.onProfilePage(identifier);
				this.onHomePage(identifier);
			}

			if ((this.url[3] === "profile" && this.url[5] === "badges") || this.url[3] === "badges") {
				this.onBadgesPage();
			}

			if (this.url.length <= 4) {
				const identifier: UsernameOrKaid = new UsernameOrKaid(kaid as string);
				this.onHomePage(identifier);
			}

			if (kaid !== null) {
				window.postMessage({
					type: "kaid",
					message: { kaid }
				}, "*");
			}

			this.first = false;
		}
	}
}

export { Extension };
