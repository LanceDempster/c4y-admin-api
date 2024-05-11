import Base from "./Base";

export interface LockType extends Base {
    id: number,
    name: string,
    description?: string
}
