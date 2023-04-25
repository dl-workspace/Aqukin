require('dotenv').config();
import { ExtendedClient } from "./structures/Client";
import { initProperties } from "./database/properties";

declare global{
    interface Array<T> {
        random() : T;
        standardDeviation() : Promise<number>;
    }
}
Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

Array.prototype.standardDeviation = async function (){
    const n = this.length;
    const mean = await this.reduce((a, b) => a + b) / n;
    return Math.sqrt(this.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

export const client = new ExtendedClient();
client.start();
initProperties(client);