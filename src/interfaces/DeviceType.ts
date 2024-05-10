import Base from "./Base";

export interface DeviceType extends Base {
    id: number,
    name: string,
    description?: string
}
