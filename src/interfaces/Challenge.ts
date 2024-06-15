import Base from "./Base";

export interface Challenge extends Base {
    id: number,
    name: string,
    description: string,
    challengeImage: string,
    challengeUrl: string,
}
