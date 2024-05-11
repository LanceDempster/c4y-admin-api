import Base from "./Base";

export interface Message extends Base {
    id: number,
    name: string,
    description?: string
}
