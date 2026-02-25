"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPRNG = createPRNG;
exports.randInt = randInt;
exports.randFloat = randFloat;
exports.randGaussian = randGaussian;
/**
 * Mulberry32 — PRNG determinístico de 32 bits.
 * Produz a mesma sequência para o mesmo seed em qualquer plataforma.
 * Não é criptograficamente seguro, mas é rápido e suficiente para simulação.
 */
function createPRNG(seed) {
    let state = seed | 0;
    return function () {
        state += 0x6d2b79f5 | 0;
        let z = state;
        z = Math.imul(z ^ (z >>> 15), z | 1);
        z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
        z = (z ^ (z >>> 14)) >>> 0;
        return z / 4294967296;
    };
}
function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}
function randFloat(rng, min, max) {
    return rng() * (max - min) + min;
}
function randGaussian(rng, mean = 0, stdev = 1) {
    const u1 = Math.max(rng(), 1e-10);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdev;
}
//# sourceMappingURL=prng.js.map