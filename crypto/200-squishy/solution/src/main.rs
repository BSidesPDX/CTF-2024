use std::{io::{Read, Write}, net::{IpAddr, SocketAddr, TcpStream}, thread::sleep, time::{Duration, Instant}};

use chacha20::{ChaCha20, cipher::{KeyIvInit, StreamCipher}};
use rand::{rngs::ThreadRng, thread_rng, Rng};

#[derive(Debug)]
pub enum PacketPayload {
    Echo,
    Ack,
    SendFlag,
    Flag(String),
    SetKey([u8; 32])
}

impl PacketPayload {
    pub fn serialize(&self) -> [u8; 244] {
        let mut out = [0; 244];

        match self {
            PacketPayload::Echo => { out[0] = 0x00 }
            PacketPayload::Ack => { out[0] = 0x01; }
            PacketPayload::SendFlag => { out[0] = 0x02; }
            PacketPayload::Flag(v) => {
                out[0] = 0x03;
                let flag_bytes = v.as_bytes();
                if flag_bytes.len() > 243 {
                    panic!("flag too long dumbass")
                }
                out[1] = flag_bytes.len() as u8;
                for (index, value) in flag_bytes.iter().enumerate() {
                    out[index + 2] = *value;
                }
            }
            PacketPayload::SetKey(v) => {
                out[0] = 0x04;
                for (index, value) in v.iter().enumerate() {
                    out[index + 1] = *value;
                }
            }
        }

        out
    }

    pub fn deserialize(inp: &[u8; 244]) -> Option<PacketPayload> {
        match inp[0] {
            0x00 => Some(PacketPayload::Echo),
            0x01 => Some(PacketPayload::Ack),
            0x02 => Some(PacketPayload::SendFlag),
            0x03 => {
                let len = inp[1] as usize;
                if len > 243 { return None }

                let bytes = &inp[2..(len + 2)];
                String::from_utf8(bytes.to_vec()).map(|s| PacketPayload::Flag(s)).ok()
            }
            0x04 => {
                let mut key = [0; 32];

                for i in 0..32 {
                    key[i] = inp[i + 1];
                }

                Some(PacketPayload::SetKey(key))
            }
            _ => None
        }
    }
}

#[derive(Debug, Clone)]
struct Packet {
    iv: [u8; 12],
    encrypted_payload: [u8; 244]
}

impl Packet {
    pub fn new(payload: PacketPayload, key: &[u8; 32], random: &mut ThreadRng) -> Packet {
        let mut serialized_payload = payload.serialize();
        let iv: [u8; 12] = random.gen();
        let mut cipher = ChaCha20::new(key.into(), &iv.into());
        cipher.apply_keystream(&mut serialized_payload);

        Packet {
            iv,
            encrypted_payload: serialized_payload
        }
    }

    pub fn decrypt(&self, key: &[u8; 32]) -> Option<PacketPayload> {
        let mut cipher = ChaCha20::new(key.into(), &self.iv.into());
        let mut payload = self.encrypted_payload.clone();
        cipher.apply_keystream(&mut payload);

        PacketPayload::deserialize(&payload)
    }

    pub fn serialize(&self) -> [u8; 256] {
        let mut out = [0; 256];

        for (i, v) in self.iv.iter().chain(self.encrypted_payload.iter()).enumerate() {
            out[i] = *v;
        }

        out
    }

    pub fn deserialize(inp: &[u8; 256]) -> Packet {
        let mut iv = [0; 12];
        inp.iter().enumerate().take(12).for_each(|(i, v)| iv[i] = *v);
        let mut encrypted_payload = [0; 244];
        inp.iter().skip(12).enumerate().for_each(|(i, v)| encrypted_payload[i] = *v);

        Packet { iv, encrypted_payload }
    }
}

pub trait HostBehavior {
    fn on_startup(&mut self, h: &mut HostInternals) -> Option<()>;
    fn on_recieve(&mut self, h: &mut HostInternals, packet: &PacketPayload) -> Option<()>;
    fn on_recieve_raw(&mut self, h: &mut HostInternals, data: &[u8; 256]) -> Option<()> {
        let pack = Packet::deserialize(data);

        let decrypted = match pack.decrypt(&h.key) {
            Some(v) => v,
            None => return None
        };

        self.on_recieve(h, &decrypted)?;

        Some(())

    }
}

pub struct HostInternals {
    key: [u8; 32],
    times_out_at: Instant,
    tcp: TcpStream
}

impl HostInternals {
    fn send_raw(&mut self, data: &[u8; 256]) -> Option<()> {
        self.tcp.write_all(data).ok()?;
        self.tcp.flush().ok()?;

        Some(())
    }

    fn send(&mut self, packet: PacketPayload) -> Option<()> {
        let data = Packet::new(packet, &self.key, &mut thread_rng()).serialize();
        self.send_raw(&data)
    }
}

pub struct Host {
    internals: HostInternals,
    behavior: Box<dyn HostBehavior>
}

impl Host {
    pub fn new(stream: TcpStream, rng: &mut ThreadRng, behavior: Box<dyn HostBehavior>) -> Host {
        Host {
            internals: HostInternals {
                key: rng.gen::<[u8; 32]>().into(),
                times_out_at: Instant::now() + Duration::from_secs(120),
                tcp: stream,
            },
            behavior
        }
    }

    fn recieved(&mut self, packet: &[u8; 256]) -> Option<()> {
        self.behavior.on_recieve_raw(&mut self.internals, packet)
    }

    pub fn run(mut self) -> Option<()> {
        self.internals.tcp.set_read_timeout(Some(Duration::from_secs(1))).ok()?;
        self.internals.tcp.set_write_timeout(Some(Duration::from_secs(1))).ok()?;

        self.behavior.on_startup(&mut self.internals)?;

        let mut buf = [0; 256];
        loop {
            if self.internals.times_out_at <= Instant::now() {
                break None;
            }
            let read = self.internals.tcp.peek(&mut buf).ok()?;

            if read >= 256 {
                self.internals.tcp.read_exact(&mut buf).ok()?;

                // recieved packet
                self.recieved(&buf)?;
            } else {
                sleep(Duration::from_millis(50));
            }
        }
    }
}

enum AttackState {
    WaitForInitial,
    SetKey,
    AskFlag,
    Done
}

pub struct EvilClientBehavior {
    state: AttackState
}

impl HostBehavior for EvilClientBehavior {
    fn on_startup(&mut self, h: &mut HostInternals) -> Option<()> {
        Some(())
    }

    fn on_recieve_raw(&mut self, h: &mut HostInternals, data: &[u8; 256]) -> Option<()> {
        match self.state {
            AttackState::WaitForInitial => {
                println!("got echo packet, modifying to set key packet and sending");
                self.state = AttackState::SetKey;
                let mut payload = *data;
                payload[12] ^= 0x04;
                h.send_raw(&payload);
            }
            AttackState::SetKey => {
                println!("key set to all zeroes, asking for flag");
                self.state = AttackState::AskFlag;
                h.key = [0; 32];
                h.send(PacketPayload::SendFlag);
            }
            AttackState::AskFlag => {
                let pack = Packet::deserialize(data);

                match pack.decrypt(&h.key) {
                    Some(v) => println!("got packet {v:?}"),
                    None => panic!()
                };
                self.state = AttackState::Done;
            }
            AttackState::Done => panic!(),
        }
        Some(())
    }

    fn on_recieve(&mut self, h: &mut HostInternals, packet: &PacketPayload) -> Option<()> {
        panic!("illegal state")
    }
}

fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    if args.len() != 3 {
        panic!("must run program with address and port as args")
    }
    let addr = args[1].parse::<IpAddr>().expect("invalid ip address");
    let port = args[2].parse::<u16>().expect("invalid port");

    let mut rng = thread_rng();
    let con = TcpStream::connect(SocketAddr::from((addr, port))).unwrap();
    
    let host = Host::new(con, &mut rng, Box::new(EvilClientBehavior { state: AttackState::WaitForInitial }));

    host.run().unwrap();
}

