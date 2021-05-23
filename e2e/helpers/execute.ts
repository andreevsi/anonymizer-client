import { exec } from 'child_process';

export function execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => (error ? reject(stderr) : resolve(stdout)));
    });
}
