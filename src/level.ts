import { Group, Vector2 } from "three";
import { Grid } from "./grid";
import { PieceConfig } from "./piece";

export interface Level<M extends Record<string, Group>, E extends Record<string, PieceConfig>> {
    title: string,
    map: keyof M,
    entities: [x: number, y: number, entity: keyof E, player?: boolean][]
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

    getLevel(key: string): Level<M,E> {
        return this.levels[key];
    }

}