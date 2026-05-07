import type { Character } from "./character.js";

export class Party {
  team: Character[] = [];
  gold = 0;

  addPlayer(character: Character): void {
    this.team.push(character);
  }
}
