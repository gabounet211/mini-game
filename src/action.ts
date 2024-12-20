import { Game } from "./game"


export interface Action{
    action(game: Game) : void
    name : string
}
