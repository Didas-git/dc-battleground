// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomArbitrary(min: number, max: number): number {
    return (Math.random() * (max - min)) + min;
}

/**
 * The maximum is exclusive and the minimum is inclusive
 */
export function getRandomInt(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor((Math.random() * (maxFloored - minCeiled)) + minCeiled);
}

/**
 * The maximum is inclusive and the minimum is inclusive
 */
export function getRandomIntInclusive(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor((Math.random() * (maxFloored - minCeiled + 1)) + minCeiled);
}
