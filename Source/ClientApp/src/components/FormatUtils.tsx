export function getReadableBytesPerSecondString(bytesPerSecond: number | undefined | null, b = 2) {
    if (bytesPerSecond === undefined || bytesPerSecond === null || 0 === bytesPerSecond) return "0B/s";
    const c = 0 > b ? 0 : b,
        d = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
    // eslint-disable-next-line security/detect-object-injection
    return parseFloat((bytesPerSecond / Math.pow(1024, d)).toFixed(c)) + ["B/s", "KB/s", "MB/s", "GB/s", "TB/s", "PB/s", "EB/s", "ZB/s", "YB/s"][d];
}

export function getReadableBytesString(bytes: number | undefined | null, b = 2) {
    if (bytes === undefined || bytes === null || 0 === bytes) return "0B";
    const c = 0 > b ? 0 : b,
        d = Math.floor(Math.log(bytes) / Math.log(1024));
    // eslint-disable-next-line security/detect-object-injection
    return parseFloat((bytes / Math.pow(1024, d)).toFixed(c)) + ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d];
}

export function getReadableBitsPerSecondString(bitsPerSecond: number | undefined | null) {
    if (bitsPerSecond === undefined || bitsPerSecond === null || bitsPerSecond === 0) return "0Kb/s";
    let i = -1;
    const byteUnits = ["Kb/s", "Mb/s", "Gb/s", "Tb/s", "Pb/s", "Eb/s", "Zb/s", "Yb/s"];
    do {
        bitsPerSecond = bitsPerSecond / 1000;
        i++;
    } while (bitsPerSecond > 1000);

    // eslint-disable-next-line security/detect-object-injection
    return Math.max(bitsPerSecond, 0.1).toFixed(0) + byteUnits[i];
}

export function ByteToBits(bytes: number) {
    return bytes * 8;
}
export function BitsToBytes(bits: number) {
    return bits / 8;
}
