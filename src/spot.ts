/* eslint-disable import/prefer-default-export */
import { ethers } from 'ethers'
import { SPOT_PRICE_CONTRACT_ABI, SPOT_PRICE_CONTRACT_ADDRESS } from './contract'

export async function getSwapRate(srcTokenAddress: string, dstTokenAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const contract = new ethers.Contract(
    SPOT_PRICE_CONTRACT_ADDRESS,
    SPOT_PRICE_CONTRACT_ABI,
    provider,
  )

  const parameters = {
    srcToken: srcTokenAddress,
    dstToken: dstTokenAddress,
    connector: '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
    thresholdFilter: 0
  }

  const rate = (await contract.getRate(
    parameters.srcToken,
    parameters.dstToken,
    parameters.connector,
    parameters.thresholdFilter
  ))[0]

  return parseFloat(ethers.formatEther(rate))
}