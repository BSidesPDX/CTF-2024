# Dinner Party Spycraft

| Authors                   | Categories      |
|:--------------------------|:----------------|
| Evan Johnson (@evanj2357) | Physical, OSINT |

## Description

Your old high school buddy Duke calls and he needs your help. He tells you that  someone has been impersonating him with forged documents, draining his retirement savings and will steal from him again. But he won’t tell you more over the phone. He wants you to come to dinner tonight in person to help him sort it out. Duke has never trusted software much, preferring hardcopy and physical things. Something about an incident shortly after he became CEO at Ellingson Mineral Corporation. 

You arrive at **Room 258** for this dinner. No other guests are here yet. After taking your coat (and bag and computer and phone), you learn that Duke had a heart attack shortly before you arrived and is in the hospital, under anesthesia for emergency surgery. You suspect someone close to Duke, one of the other guests or staff, is the mastermind thief. You must find the evidence of the fraud before the mastermind can destroy it.

You're alone in the dining room for now, but because there is plenty of staff, and other guests are due to arrive soon, the most time you'll have alone in the dining room is 7 minutes. If you're lucky you might get a second (and third) time alone in the dining room as staff and guests come and go. 

Note that: 
You are allowed only a pen/pencil and paper. Your computers, phones, tablets, etc were checked at the door by Duke’s staff.
Timeslots for this challenge are 10 minutes, 7 of which are for players.
If you are not present at the start, you will lose the spot. We mean it.

## Challenge Details

This challenge requires in-person participation, but should not require
players to own or bring any specialized tools. Any device that can browse
the internet should be sufficient for the OSINT aspect.

The setup requires:
- a classy, but expendable, table setting
- a small safe with a convenient vulnerability
- a secret to store in the safe

### Background
<details>
<summary>(spoilers!)</summary>

I was heavily inspired by [this LPL video](https://www.youtube.com/watch?v=T5YsZLJ5FjY),
and sought out a safe with same vulnerability.

The safe LPL used in that video has been patched since ~2020/2021 with
a configuration that disables the reset button while the safe is locked.
Luckily, [this HOLEWOR-branded model](https://www.amazon.com/HOLEWOR-Biometric-Fingerprint-Portable-Nightstand/dp/B0C3HGP5KK?th=1)
is, at the time of this writing, vulnerable to the same attack.
</details>

## Intended Solution
<details>
<summary>(spoilers!)</summary>

1. OSINT the safe model

    - <details>
      <summary>hint 1</summary>

      _I bought this safe on Amazon._
      </details>

    - <details>
      <summary>hint 2</summary>
    
      _Some of the reviews are surprisingly helpful._
      </details>

2. exploit the vulnerability

    - <details>
      <summary>hint 3</summary>
    
      _Check LPL's silverware drawer._
      </details>
</details>

## Flag

`pdx{alw4ysPayUrSt4ffW3ll}`
