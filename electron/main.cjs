const { app, BrowserWindow, ipcMain, net, protocol } = require("electron")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const root = path.join(__dirname, "..", "dist")

protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

function createWindow() {
    const window = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: { preload: path.join(__dirname, "preload.cjs") },
    })
    window.loadURL("app://game/index.html")
}

app.whenReady().then(() => {
    protocol.handle("app", request => {
        const file = path.join(root, decodeURIComponent(new URL(request.url).pathname))
        if (!file.startsWith(root))
            return new Response("Not found", { status: 404 })
        return net.fetch(pathToFileURL(file).toString())
    })
    ipcMain.on("quit", () => app.quit())
    createWindow()
})

app.on("window-all-closed", () => app.quit())
