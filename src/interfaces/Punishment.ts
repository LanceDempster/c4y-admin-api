import Base from "./Base";

export interface Punishment extends Base {
    name: string,
    description: string,
    punishmentImage: string,
    punishmentUrl: string,
		level: string
}
