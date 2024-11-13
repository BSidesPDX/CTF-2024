# Party Like It's 1979

```
Dust off your social skills and prepare to socialize like they did in the age before pocket computers!  BSidesPDX has a Friday social and we want to meet you, so we made a flag to encourage you to attend. To complete this challenge you’ll need to find folks at the social who have parts of the key and convince them to share. (Shamir Secret) Sharing is caring, as they say.

Please Note:
**The secret shares for this challenge will only be available during the social event.** However you will have until the regular end time to get the math right. 
You’ll need to wrap the secret in the flag format pdx{...} when you submit it. It will not be in the flag itself. 
Note that the flag is an ascii string of a very short recognizable phrase. If you are seeing something else, then most likely the math is off somewhere, or you don't have enough shares.

Resources for this Challenge (hint, hint):
https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing 
perhaps you might want to have a gander at the python code in https://www.geeksforgeeks.org/implementing-shamirs-secret-sharing-scheme-in-python/ 
https://en.wikipedia.org/wiki/ASCII 
 https://gchq.github.io/CyberChef/ 
https://www.rapidtables.com/convert/number/hex-to-ascii.html 
For python ascii-hex conversions, be aware of the following https://stackoverflow.com/questions/51369750/python-valueerror-non-hexadecimal-number-found-in-fromhex-arg-at-position-1 
```

Points: 200, static
Author: Allison

## Walkthrough

The secrets were only given out at the social event on Friday evening. You needed a minimum quorum of 5 to recover the secret (the flag), making use of the code in the geeksforgeeks link.

## Flag

`pdx{Talk2Peeps}`
