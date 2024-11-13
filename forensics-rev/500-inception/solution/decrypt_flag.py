#!/usr/bin/env python3
import random, time

# Put the timestamp here - which is the date of the email
START_TIMESTAMP = 1728409262
b = open("../distFiles/flag.png", "rb").read()

for iteration in range(30000):
    print(f"{iteration} - {START_TIMESTAMP}")
    random.seed(START_TIMESTAMP + iteration)

    B = []
    for _ in range(8):
        B.append(random.randint(0,255))

    f = bytearray(b)
    for i in range(8):
        f[i] = b[i] ^ B[i]

    # This is the one!
    if bytes(f[0:8]) == b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A':
        random.seed(START_TIMESTAMP + iteration)
        B = []
        for _ in range(len(b)):
            B.append(random.randint(0,255))
            

        f = bytearray(b)
        for i in range(len(b)):
            f[i] = b[i] ^ B[i]
            
        break

w = open("decrypted_flag.png", "wb")
w.write(f)