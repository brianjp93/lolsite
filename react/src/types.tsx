import * as t from 'io-ts'
import { isRight } from 'fp-ts/Either'
import reporter from 'io-ts-reporters'
export {
    BasicMatch,
    FullMatch,
    FullParticipant,
    BasicParticipant,
} from './iotypes/match'


export function unwrap<T>(x : t.Validation<T>) {
    if (isRight(x)) {
        return x.right
    }
    throw new Error(reporter.report(x).join('\n'));
}
