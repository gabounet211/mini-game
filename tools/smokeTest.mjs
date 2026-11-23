import { chromium } from "playwright"
import { preview } from "vite"

const server = await preview({ preview: { port: 4173, strictPort: true } })
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", error => errors.push(error.message))
await page.goto("http://localhost:4173/")
await page.waitForTimeout(3000)
const lobbyShown = await page.evaluate(() => document.body.innerText.trim().length > 0)
await browser.close()
server.httpServer.close()
if (errors.length || !lobbyShown) {
    console.error(errors.length ? errors.join("\n") : "The lobby did not appear")
    process.exit(1)
}
console.log("The built game starts without errors")
