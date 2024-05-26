import Base from "./Base";

export interface Product extends Base {

    id: number,
    product_code: number,
    product_name: string,
    price: number,
    description: string,
    prodStatus: 'ALPHA' | 'BETA' | 'LIVE'

}
