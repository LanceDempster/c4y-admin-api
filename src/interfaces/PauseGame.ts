import Base from "./Base";

export interface PauseGame extends Base {
    id: number,
    name: string,
    description?: string
}
