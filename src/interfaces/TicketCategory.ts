import Base from "./Base";

export interface TicketCategory extends Base {
    id: number,
    name: string,
    description?: string
}
