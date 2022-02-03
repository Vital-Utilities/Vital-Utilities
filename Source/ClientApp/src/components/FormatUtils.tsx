export function getReadableBytesPerSecondString(a: number | undefined | null, b = 2) {
    if (a === undefined || a === null || 0 === a) return "0 B/s";
    const c = 0 > b ? 0 : b,
        d = Math.floor(Math.log(a) / Math.log(1024));
    // eslint-disable-next-line security/detect-object-injection
    return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["B/s", "KB/s", "MB/s", "GB/s", "TB/s", "PB/s", "EB/s", "ZB/s", "YB/s"][d];
}

export function getReadableBytesString(a: number | undefined | null, b = 2) {
    if (a === undefined || a === null || 0 === a) return "0 B";
    const c = 0 > b ? 0 : b,
        d = Math.floor(Math.log(a) / Math.log(1024));
    // eslint-disable-next-line security/detect-object-injection
    return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d];
}

export function getReadableBitsPerSecondString(number: number) {
    let i = -1;
    const byteUnits = [" Kb/s", " Mb/s", " Gb/s", " Tb/s", "Pb/s", "Eb/s", "Zb/s", "Yb/s"];
    do {
        number = number / 1000;
        i++;
    } while (number > 1000);

    // eslint-disable-next-line security/detect-object-injection
    return Math.max(number, 0.1).toFixed(0) + byteUnits[i];
}

export function MBpsToMbps(number: number) {
    return number * 8;
}
