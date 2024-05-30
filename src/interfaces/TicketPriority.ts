import Base from "./Base";

export interface TicketPriority extends Base {
    id: number,
    code: string,
    name: string,
    description?: string
}
