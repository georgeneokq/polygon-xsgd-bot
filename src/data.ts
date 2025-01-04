import { readFile, writeFile } from "fs/promises"
import path from "path"

export const subscribersDir = './data'
export const subscribersFilePath = path.join(subscribersDir, 'subscribers.json')

export async function getSubscribers() {
    let subscribers: Record<number, object> = {}
    
    try {
        subscribers = JSON.parse(await readFile(subscribersFilePath, { encoding: 'utf-8' }))
    // eslint-disable-next-line no-empty
    } catch(e) {}

    return subscribers
}

export async function addSubscriber(chatId: number) {
    const subscribers = await getSubscribers()

    // Limit to 100 for data storage space considerations
    if(Object.keys(subscribers).length >= 100) return

    subscribers[chatId] = {}
    await writeFile(subscribersFilePath, JSON.stringify(subscribers))
}

export async function removeSubscriber(chatId: number) {
    const subscribers = await getSubscribers()
    delete subscribers[chatId]
    await writeFile(subscribersFilePath, JSON.stringify(subscribers))
}
