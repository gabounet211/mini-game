import { Group, Vector2 } from "three";
import { Grid } from "./grid";
import { PieceConfig } from "./piece";
import { EndCondition } from "./endCondition";

export interface Level<M extends Record<string, Group>, E extends Record<string, PieceConfig>> {
    title: string,
    chapter: string,
    finale?: boolean,
    map: keyof M,
    startCells: [x: number, y: number][]
    entities: [x: number, y: number, entity: keyof E, player?: boolean][]
    victory?: EndCondition
    defeat?: EndCondition
}

export class Levels<M extends Record<string, Group>, E extends Record<string, PieceConfig>> {

    private levels: Record<string, Level<M, E>> = {};
    private orders: string[] = [];
    private next: Record<string, string> = {}

    constructor(
        public maps: M,
        public entities: E
    ) {
    }

    createLevel(key: string, level: Level<M, E>) {
        if (this.orders.length)
            this.next[this.orders.at(-1)!] = key
        this.orders.push(key)
        this.levels[key] = level
    }

    getNext(key?: string): string {
        if (!key)
            return this.orders[0];
        return this.next[key] ?? this.orders[0]
    }

    keys() {
        return [...this.orders]
    }

    getLevel(key: string): Level<M,E> {
        return this.levels[key];
    }

}