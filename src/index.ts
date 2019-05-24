import { ExtensionImpl } from "./extension-impl";
import { KA, ACE, ScratchpadUI } from "./types/data";

declare global {
	interface Window {
		KA: KA;
		ace: ACE;
		ScratchpadUI?: ScratchpadUI;
		ScratchpadAutosuggest: { enableLiveCompletion: () => void; };
		$LAB: { queueWait: (f: () => void) => void; };
	}
}

window.KA = window.KA || {};

const impl: ExtensionImpl = new ExtensionImpl();
impl.init();
