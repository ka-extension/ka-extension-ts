import { ExtensionImpl } from "./extension-impl";
import { ACE, ScratchpadUI } from "./types/data";

declare global {
	interface Window {
		// KA: KA;
		ace: ACE;
		ScratchpadUI?: ScratchpadUI;
		ScratchpadAutosuggest: { enableLiveCompletion: () => void; };
		$LAB: { queueWait: (f: () => void) => void; };
	}
}

const impl: ExtensionImpl = new ExtensionImpl();
impl.init();
