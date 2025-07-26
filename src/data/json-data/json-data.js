import { TriviaQuestions } from "./trivia-questions.js";
import { States } from "./states.js";
import { Books } from "./books.js";
import { Albums } from "./albums.js";
import { Songs } from "./songs.js";
import { Players } from "./players.js";
import { Recipes } from "./recipes.js";
import { Students } from "./student-scores.js";
import { Countries } from "./countries.js";

export class JSONData {
  constructor() {}
  static TriviaQuestions = TriviaQuestions ? TriviaQuestions : [];
  static States = States ? States : [];
  static Books = Books ? Books : [];
  static Albums = Albums ? Albums : [];
  static Songs = Songs ? Songs : [];
  static Players = Players ? Players : [];
  static Recipes = Recipes ? Recipes : [];
  static Students = Students ? Students : [];
  static Countries = Countries ? Countries : [];
}
