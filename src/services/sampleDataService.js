import { Lists } from "../data/lists/lists.js";
import { JSONData } from "../data/json-data/json-data.js";
import { KeyValueLists } from "../data/key-values/key-values.js";
import { Objects } from "../data/objects/objects.js";

export class SampleData {
  constructor() {}
  static Lists = Lists;
  static JsonData = JSONData;
  static KeyValueLists = KeyValueLists;
  static Objects = Objects;

  static from = async (uri, apiKey) => {
    try {
      const response = await fetch(uri, {
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  static fetch = async (uri, options) => {
    try {
      return await fetch(uri, options);
    } catch (error) {
      console.error(error);
    }
  };
}
