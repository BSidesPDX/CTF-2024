from pwn import u32, p32
from random import sample

# these values should be taken programmatically from the metadata
# i noted them manually from a hexeditor

SSA = 0x1020
SS = 0x200
SC = 0x8
FAT_addr = 0x4000

def LSN (cluster_number):
    c = cluster_number - 2
    return SSA + (c*SC)

def sector_to_offset (sector_number):
    return sector_number * SS


# Main

with open ('pumpkin.fat32', 'rb') as f:
    data = f.read()

fat = []
# SS*SC is not very precise, its actually the num of FATs * size of a FAT in sectors
# coincidentally this image has 2 FATs of each half a cluster
for i in range(FAT_addr, (FAT_addr + SS*SC), 4):
    fat.append(u32(data[i:i+4], endian="little", sign="unsigned"))
eo_chain = fat[1]

file = bytearray()
current_cluster=3
while current_cluster != eo_chain:
    current_offset = sector_to_offset(LSN(current_cluster))
    cluster = data[current_offset:current_offset + (SC*SS)]
    file += cluster
    current_cluster = fat[current_cluster]

with open("output.png", 'wb') as f:
    f.write(file)
