import Base from "./Base";

export interface Product extends Base {

    description: string,
    prodStatus: 'ALPHA' | 'BETA' | 'LIVE'

} 