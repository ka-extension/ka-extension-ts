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

// tslint:disable-next-line
type anyFunc = (...args: any[]) => any; 

abstract class Extension {
	protected path: string[];
	private runCount: number = 0;
	private readonly functionCalls: Set<anyFunc>;

	constructor () {
		this.path = [];
		this.functionCalls = new Set();
	}
	protected get first (): boolean {
		return this.runCount === 1;
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
	// this.first is true when init has been called only once
	// this method ensures the extension only calls a function once
	callOnce (fnc: anyFunc, ...args: object[]) {
		if (!this.functionCalls.has(fnc)) {
			this.functionCalls.add(fnc);
			fnc(...args);
		}
	}
	async init (): Promise<void> {
		if (window.location.host.includes("khanacademy.org")) {
			this.path = location.pathname.slice(1).split("/");
			this.runCount++;

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

			if (/^\d{10,16}/.test(this.path[2])) {
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

			if (this.path[1] === "browse") {
				this.onHotlistPage();
			}

			if (this.path[0] === "profile" && !this.path[3]) {
				const identifier: UsernameOrKaid = new UsernameOrKaid(this.path[1]);
				this.onProfilePage(identifier);
				this.onHomePage(identifier);
			}

			if ((this.path[0] === "profile" && this.path[2] === "badges") || this.path[0] === "badges") {
				this.onBadgesPage();
			}

			if (this.path.length <= 1) {
				const identifier: UsernameOrKaid = new UsernameOrKaid(kaid as string);
				this.onHomePage(identifier);
			}

			if (kaid !== null) {
				window.postMessage({
					type: "kaid",
					message: { kaid }
				}, "*");
			}
		}
	}
}

export { Extension };
