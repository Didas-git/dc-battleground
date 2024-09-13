/* eslint-disable @typescript-eslint/naming-convention */
export const cfg: Record<string, { before?: string, amount: number }> = {
    1: { amount: 500 },
    200: { before: "quadratic", amount: 50000 },
    300: { before: "quadratic", amount: 200000 },
    400: { before: "firetruck", amount: 150000 },
    499: { before: "firetruck", amount: 100000 },
    500: { before: "firetruck", amount: 300000 },
    "1500-1700": { before: "exponential", amount: 2500000 },
    "1999-2000": { before: "linear", amount: 200000000 },
    "2001-2150": { before: "linear", amount: 1000000000 },
    2900: { before: "quadratic", amount: 30000000000 },
    3000: { before: "quadratic", amount: 1000000000000 }
};

function linSpace(start: number, end: number, n: number): Array<number> {
    const step = (end - start) / n;
    return Array.from({ length: n }, (_, i) => start + (i * step));
}

function logSpace(start: number, end: number, n: number): Array<number> {
    const startLog = Math.log10(start);
    const endLog = Math.log10(end);
    return linSpace(startLog, endLog, n).map((x) => Math.pow(10, x));
}

function geomSpace(start: number, end: number, n: number): Array<number> {
    const logStart = Math.log(start);
    const logEnd = Math.log(end);
    return linSpace(logStart, logEnd, n).map((x) => Math.exp(x));
}

function firetruck(x: number, y: number, n: number): Array<number> {
    const geom = geomSpace(x, y, n);
    const lastSquared = geom[geom.length - 1] ** 2;
    return geom.reverse().map((v) => (v ** 2) / lastSquared * x);
}

const functions: Record<string, (x: number, y: number, n: number) => Array<number>> = {
    exponential: (x: number, y: number, n: number): Array<number> => linSpace(Math.log(x), Math.log(y), n).map((v) => Math.exp(v)),
    quadratic: (x: number, y: number, n: number): Array<number> => geomSpace(x, y, n),
    linear: (x: number, y: number, n: number): Array<number> => linSpace(x, y, n),
    constant: (x: number, _: number, n: number): Array<number> => Array<number>(n).fill(x),
    logarithmic: (x: number, y: number, n: number): Array<number> => logSpace(x, y, n),
    firetruck
};

export function createCustomGrowthArray(config: Record<string, { before?: string, amount: number }>): Array<number> {
    const keys = Object.keys(config).sort((a, b) => parseInt(a.split("-")[0]) - parseInt(b.split("-")[0]));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const maxLevel = parseInt(keys.at(-1)!.split("-").pop()!);
    const xp = Array<number>(maxLevel + 1);
    xp[0] = 0;

    for (let i = 0, prevKey = null, { length } = keys; i < length; i++) {
        const key = keys[i];
        const split = key.split("-");
        const start = parseInt(split[0]);
        const end = parseInt(split[1] ?? split[0]);
        const { amount, before } = config[key];

        if (prevKey !== null) {
            const prevEnd = parseInt(prevKey.split("-")[1] ?? prevKey);
            const { amount: prevAmount } = config[prevKey];
            const n = start - prevEnd;
            if (before) xp.splice(prevEnd, n, ...(functions[before](prevAmount, amount, n)));
            else xp.splice(prevEnd, n, ...linSpace(prevAmount, amount, n));
        }
        xp.fill(amount, start, end + 1);
        prevKey = key;
    }

    for (let i = 0; i < maxLevel; i++) xp[i] = Math.round(xp[i]);

    return xp;
}
