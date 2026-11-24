import { chromium } from "playwright"
import { preview } from "vite"

const url = "http://localhost:4173/"
const server = await preview({ preview: { port: 4173, strictPort: true } })
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const page = await browser.newPage()
const errors = []
page.on("pageerror", error => errors.push(error.message))

function fail(message) {
    console.error(message)
    process.exit(1)
}

await page.goto(url)
await page.waitForTimeout(3000)
if (errors.length)
    fail(errors.join("\n"))
if (!await page.evaluate(() => document.body.innerText.trim().length > 0))
    fail("The lobby did not appear")

await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("miniGameSave"))
    save.unlockedLevels = 1000
    localStorage.setItem("miniGameSave", JSON.stringify(save))
})
await page.reload()
await page.waitForTimeout(2000)
const levelKeys = await page.$$eval("#lobby select option", options => options.map(option => option.value))
if (levelKeys.length < 2)
    fail("The lobby lists only " + levelKeys.length + " level(s)")

for (const key of levelKeys) {
    await page.goto(url)
    await page.waitForTimeout(1500)
    await page.selectOption("#lobby select", key)
    await page.click(".startButton")
    await page.waitForTimeout(2500)
    const objective = await page.evaluate(() => document.getElementById("objective")?.textContent ?? "")
    if (errors.length)
        fail("Level " + key + " crashed: " + errors.join("\n"))
    if (!objective.startsWith("Objective:"))
        fail("Level " + key + " did not show its objective")
    console.log(key + " - " + objective)
}

await browser.close()
server.httpServer.close()
console.log("The built game starts and every level loads without errors")
