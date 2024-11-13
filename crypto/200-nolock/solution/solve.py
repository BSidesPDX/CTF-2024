# You may have to run this script a few times for it to work (50% of time key is 0, 50% it's 1)

# fill out below
r = remote('remote-place-here', 12345)


from pwn import *
import numpy as np
TOTAL_ROUNDS = 528

def get_bit(dword, bit_idx):
    """basically returns dword[bit_idx] (treats uint32 as a 32 element array of bits)"""
    return np.right_shift(dword & np.left_shift(np.uint32(1), np.uint32(bit_idx)), np.uint32(bit_idx))

def bin_str(x, bits):
    """
    returns x as binary string of set bits
    i.e., bin_str(3, 4) = '0011'
    """
    return bin(x)[2:].zfill(bits)

# copied functions from challenge largely
def build_accepted_payload(serial_numer, btn, status, crypt_key, cnt):
    """
        builds an authenticated payload (assuming valid serial number, cnt & crypt_key)
    """
    key_mask = (1 << 16) - 1
    sn_mask = (1 << 28) - 1
    btn_mask = 0b1111
    status_mask = 0b11
    plaintext = np.uint32(((cnt & key_mask) << 16) | (key_mask & crypt_key))
    ciphertext = keeloq_encrypt(plaintext)
    # convert back into python "bignum"
    msg = bin_str(status&status_mask, 2) + bin_str(btn&btn_mask, 4) + bin_str(serial_numer&sn_mask, 28) + bin_str(int(ciphertext), 32)
    assert len(msg) == 66
    return msg

def keeloq_encrypt(data, key=0):
    """I do this, I take the data, and I make it sign an NDA"""
    key_register = np.uint64(key)
    register = data
    NLF_CONSTANT = np.uint32(0x3A5C742E)
    for i in range(TOTAL_ROUNDS):
        a = get_bit(register, 31)
        b = get_bit(register, 26)
        c = get_bit(register, 20)
        d = get_bit(register, 9)
        e = get_bit(register, 1)

        index = np.left_shift(a, np.uint32(4)) + np.left_shift(b, np.uint32(3)) + np.left_shift(c, np.uint32(2)) + np.left_shift(d, np.uint32(1)) + e
        new_msb = get_bit(NLF_CONSTANT, index) ^ get_bit(register, 0)  ^ get_bit(register, 16) ^ get_bit(np.uint32(key_register), 0)
        # during each round the register gets rightshifted by 1, and we add the new msb
        register = np.right_shift(register, np.uint32(1)) + np.left_shift(new_msb, np.uint32(31))
        # we also rotate the key register

        # new key msb
        shifted_key_bit = np.left_shift(key_register & np.uint64(1), np.uint64(63))
        np.right_shift(key_register, np.uint64(1)) + shifted_key_bit
    return register

def keeloq_decrypt(ciphertext, key=0):
    """classic keeloq decryption"""
    key_register = np.uint64(key)
    register = ciphertext
    NLF_CONSTANT = np.uint32(0x3A5C742E)

    # to prep, make sure key has been rotated sufficiently
    for i in range(TOTAL_ROUNDS):
        shifted_key_bit = np.left_shift(key_register & np.uint64(1), np.uint64(63))
        np.right_shift(key_register, np.uint64(1)) + shifted_key_bit

    for i in range(TOTAL_ROUNDS):
        # rotate key backward
        new_lsb = np.right_shift(key_register & (1<<63), np.uint64(63))
        np.left_shift(key_register, np.uint64(1)) + new_lsb

        # since register gets rotated right, the indices used in the encryption sequence are all decremented by 1
        a = get_bit(register, 30)
        b = get_bit(register, 25)
        c = get_bit(register, 19)
        d = get_bit(register, 8)
        e = get_bit(register, 0)


        index = np.left_shift(a, np.uint32(4)) + np.left_shift(b, np.uint32(3)) + np.left_shift(c, np.uint32(2)) + np.left_shift(d, np.uint32(1)) + e
        current_msb = np.right_shift( np.uint32((1<<31) & register), np.uint32(31))
        old_lsb = current_msb ^ get_bit(NLF_CONSTANT, index) ^ get_bit(register, 15) ^ get_bit(np.uint32(key_register),0)
        register = np.left_shift(register, np.uint32(1)) + old_lsb

    return register

r.recvuntil(b'EXAMPLE: ')
example_payload = int(r.recvline()[:-1], 2)
# assume key is 0
msg=example_payload
plaintext = keeloq_decrypt(np.uint32(example_payload & ((1<<32)-1)))
serial_number = (msg >> 32) & ((1 << 28)-1)
shared_key = plaintext & ((1<<16)-1)
sync_counter = (plaintext>>16) & ((1<<16)-1)
btn = (msg >> 60) & 0b1111
status = (msg >> 64) & 0b11


# build fake payload
OPEN_FLAG = 0b0010
valid_cnt = sync_counter + 1
payload = build_accepted_payload(serial_number, OPEN_FLAG, status, shared_key, valid_cnt)
print(payload)
r.sendline(bytes(payload, encoding='ascii'))
r.interactive()
