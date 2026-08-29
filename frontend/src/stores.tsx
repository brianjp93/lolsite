import {atom, atomFamily, useRecoilState} from 'recoil';

const timelineIndex = atomFamily({
  key: 'TimelineIndex',
  default: 0,
});

export const useTimelineIndex = (gameId: string) => {
  return useRecoilState(timelineIndex(gameId));
}

const pickTurnHover = atom<undefined|number>({key: 'pickTurnHover', default: undefined})

export const usePickTurn = () => {
  return useRecoilState(pickTurnHover)
}
