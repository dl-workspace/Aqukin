Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

// standard deviation calculator
Array.prototype.standardDeviation = async function (){
    const n = this.length;
    const mean = this.reduce((a, b) => a + b) / n;
    return Math.sqrt(this.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}