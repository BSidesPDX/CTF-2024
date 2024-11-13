# 

data = bytearray()
with open ('pumpkin.scramble', 'rb') as f:
    data += f.read()

data[:0x4000] = b'\xff' * 0x4000

with open ('pumpkin.cleared', 'wb') as f:
    f.write(data)
