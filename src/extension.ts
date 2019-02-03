import { UsernameOrKaid, Program } from "./types/data";
import { querySelectorPromise } from "./util/promise-util";

interface HoverQtipOptions {
	my: string;
	at: string;
}

interface KAScratchpadUI {
	scratchpad: {
		id: number;
		attributes: Program;
	};
}

interface KAdefineResult {
	data?: KAdefineData;
	ScratchpadUI?: KAScratchpadUI;
	createHoverCardQtip?: (target: HTMLElement, options: HoverQtipOptions) => void;
	getKaid? (): string;
}

interface KAdefineData {
	which?: string;
	focusId?: string;
	focusKind?: string;
	isScratchpad?: boolean;
}

interface KAdefineType {
	require (url: string): KAdefineResult;
}

function getKAdefine (): KAdefineType {
	return (window as any).KAdefine as KAdefineType;
}

const KAdefine = {
	require (url: string): KAdefineResult {
		return getKAdefine().require(url);
	},
	asyncRequire (url: string, interval: number = 100, test?: (data: KAdefineResult) => boolean, maxAttempts?: number): Promise<KAdefineResult> {
		return new Promise((resolve, reject) => {
			let counter = 0;
			const attempt = () => {
				try {
					const data: KAdefineResult = getKAdefine().require(url);
					if (test && !test(data)) {
						throw new Error("Data failed tests");
					}
					resolve(data);
				} catch (e) {
					if (!maxAttempts || counter++ < maxAttempts) {
						setTimeout(attempt, interval);
					} else if (typeof maxAttempts !== "undefined") {
						reject(e);
					}
				}
			};
			attempt();
		});
	}
};

enum KAScripts {
	SCRATCHPAD_UI = "./javascript/scratchpads-package/scratchpad-ui.js",
	DISCUSSION = "./javascript/discussion-package/util.js",
	KA = "./javascript/shared-package/ka.js",
}

const getKaid = (): Promise<string | null> => KAdefine.asyncRequire(KAScripts.KA)
	.then(req => req.getKaid ? req.getKaid() : null);

abstract class Extension {
	private readonly url: string[];
	constructor () {
		this.url = window.location.href.split("/");
	}
	abstract onProgramPage (program: Program): void | Promise<void>;
	abstract onProgramAboutPage (program: Program): void | Promise<void>;
	abstract onHotlistPage (): void;
	abstract onProfilePage (uok: UsernameOrKaid): void;
	abstract onHomePage (uok: UsernameOrKaid): void;
	abstract onPage (): void;
	abstract onProgram404Page (): void;
	abstract onDiscussionPage (uok: UsernameOrKaid): void;
	async init (): Promise<void> {
		if (window.location.host.includes("khanacademy.org")) {
			this.onPage();

			const kaid = await getKaid();

			KAdefine.asyncRequire(KAScripts.DISCUSSION, 100).then(data => {
				this.onDiscussionPage(new UsernameOrKaid(kaid as string));
			}).catch(console.error);

			KAdefine.asyncRequire(KAScripts.SCRATCHPAD_UI, 100, (data: KAdefineResult) =>
					(typeof data.ScratchpadUI !== "undefined" && typeof data.ScratchpadUI.scratchpad !== "undefined")
				).then(e => {
					if (e.ScratchpadUI && e.ScratchpadUI.scratchpad) {
						const programData = e.ScratchpadUI.scratchpad.attributes;
						this.onProgramPage(programData);
						this.onProgramAboutPage(programData);
						querySelectorPromise("#scratchpad-tabs").then(tabs => {
							tabs.childNodes[0].addEventListener("click", (e: Event) => {
								if ((e.currentTarget as HTMLAnchorElement).getAttribute("aria-selected") !== "true") {
									this.onProgramAboutPage(programData);
								}
							});
						});
					}
				}).catch(console.error);

			if (/^\d{10,16}/.test(this.url[5])) {
				querySelectorPromise("#page-container-inner", 100)
					.then(pageContent => pageContent as HTMLDivElement)
					.then(pageContent => {
						if (pageContent.querySelector("#four-oh-four")) {
							(window as any).$LAB.queueWait(() => {
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
		}
	}
}

export { Extension, getKaid, KAdefine };
