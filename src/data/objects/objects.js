import { KeyCodes } from "./keycodes.js";
import { States } from "./states.js";
import { Albums } from "./albums.js";

export class Objects {
  constructor() {}
  static KeyCodes = KeyCodes ? KeyCodes : {};
  static States = States ? States : {};
  static Albums = Albums ? Albums : {};
}
