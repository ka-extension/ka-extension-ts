import { UsernameOrKaid, Program } from "./types/data";
import { getProgram, getConvo } from "./util/api-util";

interface KAdefineResult {
	data?: KAdefineData;
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

class RefinedKAdefine {
	private readonly KAdefine: KAdefineType;
	constructor (KAdefine: KAdefineType) {
		this.KAdefine = KAdefine;
	}
	require (url: string): KAdefineResult {
		return this.KAdefine.require(url);
	}
	asyncRequire (url: string, interval: number = 100, test?: (data: KAdefineResult) => boolean, maxAttempts?: number): Promise<KAdefineResult> {
		return new Promise((resolve, reject) => {
			let counter = 0;
			const attempt = () => {
				try {
					const data: KAdefineResult = this.KAdefine.require(url);
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
}

enum KAScripts {
	DISCUSSION = "./javascript/discussion-package/discussion.js",
	KA = "./javascript/shared-package/ka.js"
}

const KAdefine: KAdefineType = (window as any).KAdefine as KAdefineType;

abstract class Extension {
	private readonly KAdefine: RefinedKAdefine;
	private readonly url: string[];
	public kaid: string;
	constructor () {
		this.url = window.location.href.split("/");
		this.KAdefine = new RefinedKAdefine(getKAdefine());
		const req = this.KAdefine.require(KAScripts.KA);
		this.kaid = req.getKaid ? req.getKaid() : "";
	}
	onDiscussionPage (): void | Promise<void> {
		console.info("Discussion package loaded");
	}
	onDetailedDiscussionPage (focusId: string, focusKind: string): void | Promise<void> {
		console.info("Detailed discussion page");
	}
	abstract onProgramPage (program: Program): void | Promise<void>;
	abstract onRepliesPage (uok: UsernameOrKaid): void | Promise<void>;
	abstract onHotlistPage (): void;
	abstract onProfilePage (uok: UsernameOrKaid): void;
	async init (): Promise<void> {
		if (window.location.host.includes("khanacademy.org")) {
			this.KAdefine.asyncRequire(KAScripts.DISCUSSION).then(e => {
				if (e) {
					this.onDiscussionPage();
					if (e.data && (e.data.which === "profile") && (this.url[6] === "replies")) {
						const identifier: UsernameOrKaid = new UsernameOrKaid(this.url[4]);
						this.onRepliesPage(identifier);
					}
				}
			}).catch(console.error);

			this.KAdefine.asyncRequire(KAScripts.DISCUSSION, 100, (data: KAdefineResult) =>
				typeof data.data !== "undefined" && typeof data.data.focusId !== "undefined" &&
				typeof data.data.focusKind !== "undefined").then(e => {
					if (e.data && e.data.focusId && e.data.focusKind) {
						this.onDetailedDiscussionPage(e.data.focusId, e.data.focusKind);
						if (e.data.focusKind === "scratchpad") {
							getProgram(e.data.focusId).then(e => this.onProgramPage(e));
						}
					}
				}).catch(console.error);

			if (this.url[5] === "browse") {
				this.onHotlistPage();
			}
			if (this.url[3] === "profile" && !this.url[6]) {
				const identifier: UsernameOrKaid = new UsernameOrKaid(this.url[4]);
				this.onProfilePage(identifier);
			}
		}
	}
}

export { Extension };
