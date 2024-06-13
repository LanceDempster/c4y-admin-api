import Base from "./Base";

export interface BillingStatus extends Base {
    id: number,
    status: string,
    description?: string
}
