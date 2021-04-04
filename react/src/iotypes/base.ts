import * as t from 'io-ts';


export function maybe(x : t.Mixed) {
    return t.union([x, t.undefined])
}

export function optional(x : t.Mixed) {
    return t.union([x, t.null])
}
