from dataclasses import dataclass
import logging
import sys

import requests


@dataclass
class Command():
    name: str
    args: list[str]


def handle_commands(data: str) -> str:
    commands = data.split(';')
    output = []
    for cmd in commands:
        command = parse(cmd)
        output.append(run_command(command) + '\n')

    return ''.join(output)


def run_command(command: Command) -> str:
    logging.info(f"cmd: {command.name}")
    match command.name:
        case 'check_health':
            resp = requests.get('http://localhost:8080/health')
            return 'okay' if resp.status_code == 200 else 'unhealthy'
        case 'check_flag':
            flag = read_flag()
            if command.args[0] == flag:
                return 'correct'
            return 'incorrect'
        case 'export_log_files':
            files = command.args[0:-1]
            destination = command.args[-1]
            files = { f'logfile{n}':open(path, 'rb') for n, path in enumerate(files) }
            headers = {'content-type': 'application/x-www-form-urlencoded'}
            resp = requests.put(destination, files=files, headers=headers)
            return str(resp.status_code)
        case _:
            return 'unknown command'


def parse(command: str) -> Command:
    elems = command.split(' ')
    return Command(elems[0], elems[1:])


def read_flag() -> str:
    with open('./flag.txt', 'r') as f:
        flag = f.readline().strip()

    return flag


if __name__ == '__main__':
    logging.info("reading commands...")
    data = sys.stdin.read(128)
    results = handle_commands(data)
    sys.stdout.write(results)
