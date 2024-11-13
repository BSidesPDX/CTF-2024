from pwn import u32, p32
from random import sample

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

data = bytearray()
with open ('pumpkin.raw', 'rb') as f:
    data += f.read()

fat = []
for i in range(FAT_addr, (FAT_addr + SS*SC), 4):
    fat.append(u32(data[i:i+4], endian="little", sign="unsigned"))
eo_chain = fat[1]

file = []
current_cluster=4 # not 3, because i want to leave 3 in place
#print(hex(sector_to_offset(LSN(current_cluster))))
while current_cluster != eo_chain:
    current_offset = sector_to_offset(LSN(current_cluster))
    cluster = data[current_offset:current_offset + (SC*SS)]
    file.append(cluster) #file += cluster
    current_cluster = fat[current_cluster]

#with open("test.jpg", 'wb') as f:
#    f.write(file)

last_cluster = len(file) + 3 # +3 bc the start is at index 3, this is an upperbound
new_indexes = sample(range(4, last_cluster+1), k=len(range(4, last_cluster+1)))

assert(len(file) == len(new_indexes))

idofnew = 0
last_cluster_n = 3
for cluster_data in file:
    new_idx = new_indexes[idofnew]
    new_offset = sector_to_offset(LSN(new_idx))
    data[new_offset:(new_offset+SC*SS)] = cluster_data
    data[FAT_addr+(last_cluster_n*4):FAT_addr+(last_cluster_n*4)+4] = p32(new_idx, endian="little", sign="unsigned")
    last_cluster_n = new_idx
    idofnew += 1

data[FAT_addr+(last_cluster_n*4):FAT_addr+(last_cluster_n*4)+4] = p32(eo_chain, endian="little", sign="unsigned")

with open("pumpkin.scramble", "wb") as f:
    f.write(data)



