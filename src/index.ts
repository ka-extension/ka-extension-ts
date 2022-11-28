import { Extension } from "./extension";
import { ExtensionImpl } from "./extension-impl";
import { ACE, ScratchpadUI } from "./types/data";

const impl: Extension = new ExtensionImpl();
impl.register();
impl.init();
