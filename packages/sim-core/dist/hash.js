"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStateHash = computeStateHash;
exports.stableStringify = stableStringify;
/**
 * Hash determinístico cross-platform usando FNV-1a 64-bit
 * (implementação JS pura, sem dependências de runtime).
 */
function computeStateHash(data) {
    const json = stableStringify(data);
    return fnv1a64(json);
}
function stableStringify(obj) {
    if (obj === null || obj === undefined)
        return 'null';
    if (typeof obj === 'number')
        return isFinite(obj) ? String(obj) : 'null';
    if (typeof obj === 'boolean')
        return String(obj);
    if (typeof obj === 'string')
        return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(stableStringify).join(',') + ']';
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort();
        return ('{' +
            keys
                .map((k) => JSON.stringify(k) +
                ':' +
                stableStringify(obj[k]))
                .join(',') +
            '}');
    }
    return String(obj);
}
function fnv1a64(str) {
    let h1 = 0xdeadbeef | 0;
    let h2 = 0x41c6ce57 | 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 0x9e3779b1);
        h2 = Math.imul(h2 ^ ch, 0x5f356495);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 0x45d9f3b);
    h1 = Math.imul(h1 ^ (h1 >>> 16), 0x45d9f3b);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 0x45d9f3b);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 0x45d9f3b);
    return ((h1 >>> 0).toString(16).padStart(8, '0') +
        (h2 >>> 0).toString(16).padStart(8, '0'));
}
//# sourceMappingURL=hash.js.map