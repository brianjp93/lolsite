import {atomFamily, useRecoilState} from 'recoil';

const timelineIndex = atomFamily({
  key: 'TimelineIndex',
  default: 0,
});

export const useTimelineIndex = (gameId: string) => {
  return useRecoilState(timelineIndex(gameId));
}
