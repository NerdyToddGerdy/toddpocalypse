# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the game
python main.py

# Install dependencies
poetry install

# Run with Poetry's managed environment
poetry run python main.py
```

There are no tests or linter configurations set up yet.

## Architecture

**toddpocalypse** is a work-in-progress Python CLI RPG battle game. The entry point is `main.py`, which sets up two parties and is intended to run a turn-based combat loop (not yet implemented — see TODOs in `main.py`).

### Module relationships

```
main.py
  └── Character  (__init__.py)
        └── Inventory  (__init__.py)
              └── Gear  (__init__.py)
  └── Party  (__init__.py)
        └── Character
```

- **`Character/`** — `Character` (name, class, level, health, inventory) and `AttackCharacter` (wraps a `Character` + its d20 roll + team string for battle ordering). `switch()` maps job integers (1/2/3) to `"fighter"/"rogue"/"mage"`.
- **`Gear/`** — `Weapon` with procedurally generated names assembled from TYPE × QUAL × ADJ string lists. `get_weapon()` is the only factory.
- **`Inventory/`** — thin wrapper around `List[Weapon]`; belongs to each `Character`.
- **`Party/`** — holds `List[Character]` and a gold counter; both the player party and enemy party are `Party` instances.
- **`Character/AmazingTale.py`** — a separate, currently unused `Hero`/`Skill` system built around a die-size hierarchy (d12/d10/d8/d6). Not wired into `main.py`.

### Intended battle flow (incomplete)

`main.py` builds both parties, collects player input for name and class, then needs a `while` loop that:
1. Rolls d20 for every alive character in both parties (`roll_results` into a combined list).
2. Sorts the list by roll to determine attack order.
3. Each `AttackCharacter` calls `attacker.character.attack(target)` against the opposing team.
4. Loop ends when only one team has living members.

### OLD_CODE/

Minified JavaScript from a prior browser-based version ("clickpocalypse"). Reference only — not part of the Python build.
