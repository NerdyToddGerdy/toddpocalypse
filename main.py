# This is a sample Python script.
import random
from typing import List

from Character import Character, switch, AttackCharacter
from Gear import (
    get_weapon
)
from Party import Party

# Press ⇧⌘F11 to execute it or replace it with your code.
# Press Double ⇧ to search everywhere for classes, files, tool windows, actions,
# and settings.


def roll(integer: int):
    return random.randint(1, integer)


def roll_results(res_list: list, char_list: List[Character], team: str):
    dice = 20
    for c in char_list:
        res_list.append(
            AttackCharacter(
                roll_int=roll(dice),
                character=c,
                team=team
            )
        )


if __name__ == '__main__':
    enemies = Party()
    enemies.add_player(Character("Bob", switch(1), level=1))
    enemies.team[0].inventory.add_weapon(get_weapon())
    enemies.add_player(Character("Billy", switch(1), level=1))

    name = input("What is your name?\n")
    print(f'You input {name}')
    job = input("How have you been trained?\n"
                "Are you a:\n"
                "1) fighter\n"
                "2) rogue\n"
                "3) mage\n")

    print(f'AH! So you are a {switch(int(job))}')

    party = Party()
    party.add_player(Character("Todd", switch(int(job)), level=1))
    party.team[0].inventory.add_weapon(get_weapon())
    party.add_player(Character("John", switch(2), level=1))



    # TODO: Create a while loop for the battle. going through order until
    #   order only has one team in it. Figure out how to get this to only
    #   check at the end of every turn.  Maybe 'order' variable has a
    #   player_count section
    # TODO: Wait after each player for user to press enter key
    print("There is where I will leave off for the night")
# See PyCharm help at https://www.jetbrains.com/help/pycharm/
