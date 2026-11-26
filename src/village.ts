import { Building, buildingNames } from "./lobby"
import { SaveData } from "./save"
import { resourceNames, resources } from "./base"
import { researchProjects } from "./research"
import { levels } from "./gltf"

type Look = "house" | "hall" | "circle" | "fields"

const layout: [Building, Look, number, number, string][] = [
    ["trainingGrounds", "house", 9, 17, "#C0602A"],
    ["summoning", "circle", 28, 22, "#6E5AA8"],
    ["warHall", "hall", 41, 20, "#C0392B"],
    ["shrine", "house", 69, 16, "#7B5CC4"],
    ["library", "house", 82, 37, "#3D6FD9"],
    ["storehouse", "house", 10, 62, "#8C6B2E"],
    ["forge", "house", 33, 67, "#4E5466"],
    ["fields", "fields", 62, 68, "#8A6A3E"],
]

const trees: [number, number, number, string][] = [
    [3, 12, 54, "#5E9E3E"], [23, 11, 40, "#4F8F35"], [62, 10, 46, "#5E9E3E"], [93, 17, 60, "#4F8F35"],
    [89, 12, 38, "#6FAE4C"], [4, 44, 44, "#6FAE4C"], [25, 46, 30, "#5E9E3E"], [64, 42, 34, "#6FAE4C"],
    [94, 67, 52, "#5E9E3E"], [87, 80, 40, "#4F8F35"], [3, 88, 60, "#4F8F35"], [26, 88, 44, "#5E9E3E"],
    [60, 90, 36, "#6FAE4C"], [82, 92, 50, "#5E9E3E"],
]

const houseSvg = (roof: string) => `<svg width="150" height="122" viewBox="0 0 160 130" aria-hidden="true"><rect x="20" y="58" width="120" height="70" rx="4" fill="#F2E6C9" stroke="#B49A6A" stroke-width="2"/><polygon points="4,62 80,6 156,62" fill="${roof}"/><rect x="66" y="88" width="28" height="40" rx="14" fill="#6B4A2B"/><rect x="34" y="76" width="20" height="18" rx="3" fill="#F5CF72"/><rect x="106" y="76" width="20" height="18" rx="3" fill="#F5CF72"/></svg>`

const hallSvg = (roof: string) => `<svg width="250" height="196" viewBox="0 0 280 220" aria-hidden="true"><rect x="30" y="20" width="44" height="190" rx="4" fill="#E9DCBC" stroke="#B49A6A" stroke-width="2"/><rect x="206" y="20" width="44" height="190" rx="4" fill="#E9DCBC" stroke="#B49A6A" stroke-width="2"/><polygon points="24,24 52,0 80,24" fill="#3D6FD9"/><polygon points="200,24 228,0 256,24" fill="#3D6FD9"/><rect x="70" y="80" width="140" height="130" fill="#F2E6C9" stroke="#B49A6A" stroke-width="2"/><polygon points="60,86 140,30 220,86" fill="${roof}"/><path d="M116 210v-48a24 24 0 0 1 48 0v48z" fill="#6B4A2B"/><rect x="44" y="60" width="16" height="44" fill="#E8B23A"/><rect x="220" y="60" width="16" height="44" fill="#E8B23A"/><rect x="128" y="98" width="24" height="24" rx="12" fill="#F5CF72"/></svg>`

const circleSvg = () => `<svg width="150" height="90" viewBox="0 0 150 90" aria-hidden="true"><ellipse cx="75" cy="45" rx="73" ry="43" fill="#6E5AA8"/><ellipse cx="75" cy="45" rx="62" ry="35" fill="none" stroke="#C9BCF5" stroke-width="3"/><ellipse cx="75" cy="45" rx="48" ry="26" fill="none" stroke="#9C88E0" stroke-width="2" stroke-dasharray="6 5"/><path d="M75 22l6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1z" fill="#F1E9D6"/></svg>`

const fieldsSvg = () => `<svg width="250" height="104" viewBox="0 0 250 104" aria-hidden="true"><rect width="250" height="104" rx="10" fill="#8A6A3E"/>${[0, 1, 2, 3, 4, 5].map(index => `<rect x="${8 + index * 40}" y="8" width="34" height="88" rx="3" fill="${index < 3 ? "#E3C35A" : "#7DB55A"}"/>`).join("")}</svg>`

export class Village {
    private element = document.createElement('div')
    private stock = document.createElement('div')
    private statuses = new Map<Building, HTMLSpanElement>()

    constructor(private save: SaveData, private onEnter: (building: Building) => void) {
        this.element.id = 'village'
        this.stock.className = 'villageStock'
        const hint = document.createElement('div')
        hint.className = 'villageHint'
        hint.textContent = 'Click a building to enter it'
        this.element.append(...trees.map(entry => this.createTree(...entry)), this.stock, ...layout.map(entry => this.createBuilding(...entry)), hint)
        document.body.append(this.element)
        this.show()
    }

    show() {
        this.stock.textContent = resources.map(resource => resourceNames[resource] + ' ' + this.save.resources[resource]).join(' · ')
        for (const [building, status] of this.statuses)
            status.textContent = this.status(building)
        this.element.style.display = 'block'
    }

    remove() {
        this.element.remove()
    }

    private createTree(left: number, top: number, size: number, color: string) {
        const tree = document.createElement('span')
        tree.className = 'tree'
        tree.style.left = left + '%'
        tree.style.top = top + '%'
        tree.style.width = tree.style.height = size + 'px'
        tree.style.backgroundColor = color
        return tree
    }

    private createBuilding(building: Building, look: Look, left: number, top: number, color: string) {
        const button = document.createElement('button')
        button.className = 'building'
        button.dataset.building = building
        button.style.left = left + '%'
        button.style.top = top + '%'
        button.innerHTML = look === "hall" ? hallSvg(color) : look === "circle" ? circleSvg() : look === "fields" ? fieldsSvg() : houseSvg(color)
        const plaque = document.createElement('span')
        plaque.className = 'plaque' + (look === "hall" ? ' mainPlaque' : '')
        const name = document.createElement('span')
        name.className = 'plaqueName'
        name.textContent = buildingNames[building]
        const status = document.createElement('span')
        status.className = 'plaqueStatus'
        this.statuses.set(building, status)
        plaque.append(name, status)
        button.append(plaque)
        button.addEventListener('click', () => {
            this.element.style.display = 'none'
            this.onEnter(building)
        })
        return button
    }

    private status(building: Building) {
        const save = this.save
        switch (building) {
            case "warHall": return 'Next: ' + levels.getLevel(levels.keys()[Math.max(0, Math.min(save.unlockedLevels, levels.keys().length) - 1)]).title
            case "trainingGrounds": return save.roster.reduce((total, character) => total + character.skillPoints, 0) + ' skill points'
            case "shrine": return 'Combination · Memorial'
            case "storehouse": return save.inventory.length + ' items'
            case "fields": return Object.keys(save.harvest).length + ' workers'
            case "library": return save.research.current ? researchProjects[save.research.current].name : 'No research'
            case "forge": return 'Craft · Upgrade'
            case "summoning": return save.summons + ' tokens'
        }
    }
}
