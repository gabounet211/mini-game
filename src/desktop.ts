export interface Desktop {
    quit(): void
}

export const desktop = (window as unknown as { desktop?: Desktop }).desktop
