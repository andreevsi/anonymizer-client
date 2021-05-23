/* eslint-disable no-console */
export function stdout(message: any) {
    console.log('\x1b[0m', message);
}

export function debug(message: any) {
    console.log('\x1b[34m', message);
}

export function error(message: any) {
    console.log('\x1b[31m', message);
}

export function info(message: any) {
    console.log('\x1b[33m', message);
}
