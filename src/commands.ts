// Command handlers

import { ethers } from "ethers";
import { Context } from "grammy";
import { USDC_ADDRESS, XSGD_ADDRESS } from "./contract";
import { getSwapRate } from "./spot";
import { getNeededTokenAmountsForPosition, getPoolContract, getTick } from "./uniswap";
import { roundDecimal } from "./util";

export async function uniswapQuote(args: string[], ctx: Context) {
  if (args.length !== 4) {
    await ctx.reply('Format: <AMT_USD> <AMT_SGD> <LOWER_BOUND> <UPPER_BOUND>')
    return
  }

  const balanceUSDC = +args[0]
  const balanceXSGD = +args[1]
  const lower = +args[2]
  const upper = +args[3]

  if (Number.isNaN(balanceUSDC) || Number.isNaN(balanceXSGD) || Number.isNaN(lower) || Number.isNaN(upper)) {
    await ctx.reply('Format: <AMT_USDC> <AMT_XSGD> <LOWER_BOUND> <UPPER_BOUND>\nNumbers only!')
    return
  }

  await ctx.reply('Calculating required amount to swap...')

  const [usdcXsgdSwapRate, xsgdUsdcSwapRate] =
    await Promise.all([
      getSwapRate(USDC_ADDRESS, XSGD_ADDRESS),
      getSwapRate(XSGD_ADDRESS, USDC_ADDRESS)
    ])

  // Ensure there is enough total sum (USDC) in wallet to mint/add to the position
  const totalUsd = balanceUSDC + balanceXSGD * xsgdUsdcSwapRate
  const desiredAmtUsd = totalUsd * 0.995 // keep 0.5% in wallet

  const fee = 500n
  const poolContract = await getPoolContract(fee)
  const [slot0] = await Promise.all([
    poolContract.slot0(),
  ])
  const tickLower = getTick(lower)
  const tickUpper = getTick(upper)

  const { amountUSDC, amountXSGD } = await getNeededTokenAmountsForPosition(roundDecimal(desiredAmtUsd, 2).toString(), slot0, tickLower, tickUpper)

  const requiredAmountsStr = `Required USDC: ${+ethers.formatUnits(amountUSDC, 6)}\nRequired XSGD: ${+ethers.formatUnits(amountXSGD, 6)}`

  if (balanceXSGD < amountXSGD) {
    const neededXSGD = +ethers.formatUnits(amountXSGD, 6) - balanceXSGD
    // Add 0.5% to the swap amount to account for potential slippage
    const usdToSell = (neededXSGD * xsgdUsdcSwapRate * 1.005).toFixed(6)
    await ctx.reply(`${requiredAmountsStr}\nAction: Sell ${usdToSell} USDC`)
  } else if (balanceUSDC < amountUSDC) {
    const neededUSDC = +ethers.formatUnits(amountUSDC, 6) - balanceUSDC
    // Add 0.5% to the swap amount to account for potential slippage
    const sgdToSell = (neededUSDC * usdcXsgdSwapRate * 1.005).toFixed(6)
    await ctx.reply(`${requiredAmountsStr}\nAction: Sell ${sgdToSell} XSGD`)
  } else {
    await ctx.reply('No action required')
  }
}
