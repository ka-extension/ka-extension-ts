import { UsernameOrKaid, Program } from "./types/data";
import { getProgram } from "./util/api-util";
import { querySelectorPromise } from "./util/promise-util";

interface HoverQtipOptions {
	my: string;
	at: string;
}

interface KAdefineResult {
	data?: KAdefineData;
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
	DISCUSSION = "./javascript/discussion-package/discussion.js",
	KA = "./javascript/shared-package/ka.js"
}

const getKaid = (): Promise<string | null> => KAdefine.asyncRequire(KAScripts.KA)
	.then(req => req.getKaid ? req.getKaid() : null);

abstract class Extension {
	private readonly url: string[];
	constructor () {
		this.url = window.location.href.split("/");
	}
	onDiscussionPage (): void | Promise<void> {
		console.info("Discussion package loaded");
	}
	onDetailedDiscussionPage (focusId: string, focusKind: string): void | Promise<void> {
		console.info("Detailed discussion page");
	}
	abstract onProgramPage (program: Program): void | Promise<void>;
	abstract onProgramAboutPage (program: Program): void | Promise<void>;
	abstract onRepliesPage (uok: UsernameOrKaid): void | Promise<void>;
	abstract onHotlistPage (): void;
	abstract onProfilePage (uok: UsernameOrKaid): void;
	abstract onHomePage (uok: UsernameOrKaid): void;
	abstract onNewProgramPage (): void;
	abstract onPage (): void;
	async init (): Promise<void> {
		if (window.location.host.includes("khanacademy.org")) {
			this.onPage();
			KAdefine.asyncRequire(KAScripts.DISCUSSION).then(e => {
				if (e) {
					this.onDiscussionPage();
				}
			}).catch(console.error);

			if (this.url[5] === "discussion" && this.url[6] === "replies" && this.url[3] === "profile") {
				const identifier: UsernameOrKaid = new UsernameOrKaid(this.url[4]);
				this.onRepliesPage(identifier);
			}

			if (this.url[4] === "new" && /webpage|pjs|sql/ig.test(this.url[5])) {
				this.onNewProgramPage();
			}

			KAdefine.asyncRequire(KAScripts.DISCUSSION, 100, (data: KAdefineResult) =>
				typeof data.data !== "undefined" && typeof data.data.focusId !== "undefined" &&
				typeof data.data.focusKind !== "undefined").then(e => {
					if (e.data && e.data.focusId && e.data.focusKind) {
						this.onDetailedDiscussionPage(e.data.focusId, e.data.focusKind);
						if (e.data.focusKind === "scratchpad") {
							getProgram(e.data.focusId).then(programData => {
								this.onProgramPage(programData);
								this.onProgramAboutPage(programData);
								querySelectorPromise("#scratchpad-tabs").then(tabs => {
									tabs.childNodes[0].addEventListener("click", () => this.onProgramAboutPage(programData));
								});
							});
						}
					}
				}).catch(console.error);

			if (this.url[5] === "browse") {
				this.onHotlistPage();
			}

			if (this.url[3] === "profile" && !this.url[6]) {
				const identifier: UsernameOrKaid = new UsernameOrKaid(this.url[4]);
				this.onProfilePage(identifier);
				this.onHomePage(identifier);
			}

			const kaid = await getKaid();
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
