import { mkdirSync } from "fs";
import { Bot, GrammyError, HttpError } from "grammy";
import { addSubscriber, getSubscribers, removeSubscriber, subscribersDir } from "./data";
import { getSwapRate } from "./spot";
import { sleep } from "./util";

const botToken = process.env.BOT_TOKEN

if (!botToken) {
  throw new Error('BOT_TOKEN not set in environment variable')
}

const bot = new Bot(botToken)

let currentPrice = ''

;(async () => {
  currentPrice = (await getSwapRate()).toFixed(5)
})()

// Add user to subscriber list and send initial price update
bot.command("start", async (ctx) => {
  const { chatId } = ctx
  addSubscriber(chatId)

  ctx.api.sendMessage(chatId, 'Use /unsub to unsubscribe anytime.')

  while(currentPrice === '') {
    // eslint-disable-next-line no-await-in-loop
    await sleep(100)
  }

  ctx.api.sendMessage(chatId, currentPrice)
})

// Add user to subscriber list
bot.command("unsub", async (ctx) => {
  const { chatId } = ctx
  removeSubscriber(chatId)

  ctx.api.sendMessage(chatId, 'Unsubscribed.')
})

// Default error handler by grammy
bot.catch((err) => {
  // const { ctx } = err
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
})

// Start the bot
bot.start()

mkdirSync(subscribersDir, { recursive: true })

setInterval(async () => {
  const swapRate = await getSwapRate()
  const swapRateRounded = swapRate.toFixed(5)

  if (swapRateRounded === currentPrice) return

  currentPrice = swapRateRounded

  for (const subscriber of Object.keys(await getSubscribers())) {
    bot.api.sendMessage(subscriber, swapRateRounded)
  }
}, 5000);
