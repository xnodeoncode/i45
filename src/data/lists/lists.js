import { Astronomy } from "./astronomy.js";
import { Simpsons } from "./simpsons.js";
import { States } from "./states.js";

export class Lists {
  constructor() {}
  static Astronomy = Astronomy ? Astronomy : [];
  static States = States ? States : [];
  static Simpsons = Simpsons ? Simpsons : [];
}
