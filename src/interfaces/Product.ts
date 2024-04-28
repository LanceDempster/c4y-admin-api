import Base from "./Base";

export interface Product extends Base {

    id: number,
    price: number,
    description: string,
    prodStatus: 'ALPHA' | 'BETA' | 'LIVE'

}
