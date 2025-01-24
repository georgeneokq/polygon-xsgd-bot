export async function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}

/**
 * 
 * @param args string
 * @returns items split by whitespace, excluding empty items
 */
export function getArgs(args: string) {
    return args.split(' ').filter(s => s.length)
}

/**
 * Cut off at specified number of decimal places without rounding
 */
export function roundDecimal(value: number, numDecimalPlaces: number) {
  return Math.floor(value * 10 ** numDecimalPlaces) / 10 ** numDecimalPlaces
}
