import Base from "./Base";

export interface Rule extends Base {
    id: number,
    name: string,
    description?: string
}
