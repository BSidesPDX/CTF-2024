
The attached email file contains an attachment which is really a program that encrypts the `flag.png` file. You are tasked with decrypting this flag file! In order to do so, you need to reverse engineer the program!

Note the time the email was sent - 8 Oct 2024 10:41:02 -0700 (PDT) - which is `1728409262` as a Unix timestamp.

The program is like a onion - layers and layers of programs, written in multiple different languages, that get invoked (some of the compiled on the spot!) until the final stage that encrypts the file. The layers are as follows:

The program is an ELF (compiled from C) which generates a PowerShell script embedded inside of it and invokes it. This PS1 script takes some C++ code, compiles it, and invokes it. This, in turn, takes a JavaScript script and runs it with Node.js. This will take some C code, compile it, and run it. This, in turns, has a Java class file (not Java source, but the compiled class file) embedded inside of it and it executes it. This takes some C++ code and compiles it, and then finally an inline Python script is invoked which does the encryption.

The "inner" stage is represented as a hardcoded string inside the sourcecode/binary. You can copy/dump those bytes to manually reverse them - looking at the code in question will indicate how it was encoded, mostly a base64 encoding with a constant offset applied to each byte.

When the program was initially run, it successfully got through every stage and encrypted the flag file. However, now, it no longer runs! This is because the malware is time-bound - there are checks to see if it is being run past a certain date (plus or minus a couple seconds on Unix time `1729014062`), and if so, it quits early. This is a light anti-debugging strategy, making analyses more cumbersome. Additionally, each payload is encoded in a variation of Base64 (with constants offsets) or memfrob. These strings can be extracted from the binaries and manually reversed to get the code of the next stage.

At multiple steps the malware will write the current source code or binary of the current stage to a file in `/dev/shm/` (with an increasing number of periods (`.`) indicating a further stage of the malware). This is a tmpfs directory - meaning it gets erased when the computer restarts. This is a common place for malware to do temporary file operations.

Once you extract the final Python payload, you will see that it `xor`s the flag file to encrypt it. You need to retrieve the original value that was used to xor the file bytes with to get it back. This can be done due to the xor value being seeded on the time `random.seed(round(time.time()))`. You can brute force possible values for this by starting at the time the email was sent and incrementing it, and at each stage xoring the bytes and checking if the magic bytes of the PNG line are correct, at which point you know the PNG was reconstructed.



