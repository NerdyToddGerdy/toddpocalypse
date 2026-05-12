import type { Character } from "./character.js";

/** The player's active party: an ordered list of characters sharing a gold pool. */
export class Party {
  /** Ordered list of characters; index 0 is always the lead (player-controlled). */
  team: Character[] = [];
  /** Shared gold balance for the entire party. */
  gold = 0;

  /** Appends a character to the end of the party roster. */
  addPlayer(character: Character): void {
    this.team.push(character);
  }
}
