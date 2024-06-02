import Base from "./Base";

export interface Ticket extends Base {
    id: number,
		userId?: number
		staffId?: number,
		staffName?: string,
		userEmail?: string,
    title: string,
    description?: string
    categoryId: number
		priorityId: number
		statusId: number
}
