import Base from "./Base";

export interface TicketStatus extends Base {
    id: number,
    name: string,
    description?: string
}
