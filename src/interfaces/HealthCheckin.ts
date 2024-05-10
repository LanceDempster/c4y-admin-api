import Base from "./Base";

export interface HealthCheckin extends Base {
    id: number,
    name: string,
    description?: string
}
