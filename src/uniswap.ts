import { ethers } from "ethers"
import { UNISWAP_FACTORY_ADDRESS, USDC_ADDRESS, XSGD_ADDRESS } from "./contract"
import { UNISWAP_FACTORY_ABI, UNISWAP_POOL_ABI } from "./abi"

interface Slot0 {
  sqrtPriceX96: bigint
  tick: number
  observationIndex: number
  observationCardinality: number
  observationCardinalityNext: number
  feeProtocol: number
  unlocked: boolean
}


const Q96 = 2n ** 96n;

function getTickAtSqrtPrice(sqrtPriceX96: bigint) {
  return Math.floor(Math.log((Number(sqrtPriceX96) / Number(Q96)) ** 2) / Math.log(1.0001));
}

export function getTick(price: number) {
  let tick = Math.floor(Math.log(price) / Math.log(1.0001))
  tick -= (tick % 10)
  return tick
}

export async function getPoolContract(fee: bigint) {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const uniswapFactoryContract = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, UNISWAP_FACTORY_ABI, provider)
  const poolAddress = await uniswapFactoryContract.getPool(USDC_ADDRESS, XSGD_ADDRESS, fee)
  const poolContract = new ethers.Contract(poolAddress, UNISWAP_POOL_ABI, provider)

  return poolContract
}

export async function getNeededTokenAmountsForPosition(amt: string, slot0: Slot0, tickLower: number | bigint, tickUpper: number | bigint) {
  const amount = ethers.parseUnits(amt, 6)
  const sqrtRatioA = Math.sqrt(1.0001 ** Number(tickLower));
  const sqrtRatioB = Math.sqrt(1.0001 ** Number(tickUpper));
  const currentTick = getTickAtSqrtPrice(slot0.sqrtPriceX96);
  const sqrtPrice = Number(slot0.sqrtPriceX96) / Number(Q96);

  const vLiquid = Number(amount) * ((sqrtRatioA * sqrtRatioB) / (sqrtRatioB - sqrtRatioA))
  let amountUSDC = 0n
  let amountXSGD = 0n
  if (currentTick < Number(tickLower)) {
    amountUSDC = BigInt(Math.floor(vLiquid * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB))));
  } else if (currentTick >= Number(tickUpper)) {
    amountXSGD = BigInt(Math.floor(vLiquid * (sqrtRatioB - sqrtRatioA)));
  } else if (currentTick >= Number(tickLower) && currentTick < Number(tickUpper)) {
    amountUSDC = BigInt(Math.floor(vLiquid * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB))));
    amountXSGD = BigInt(Math.floor(vLiquid * (sqrtPrice - sqrtRatioA)));
  }

  return { amountUSDC, amountXSGD }
}
