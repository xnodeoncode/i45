import { States } from "./states.js";
import { Countries } from "./countries.js";
export class KeyValueLists {
  constructor() {}
  static States = States ? States : [];
  static Countries = Countries ? Countries : [];
}
