import { MAX_USERS_ON_GRID } from '@/components/UserGrid';

export default {
    state: {
        displayUsersStartIdx: 0,
        displayUsersEndIdx: MAX_USERS_ON_GRID,
    },
    mutations: {
        setDisplayUsersStartIdx(state, displayUsersStartIdx) {
            state.displayUsersStartIdx = displayUsersStartIdx;
        },
        setDisplayUsersEndIdx(state, displayUsersEndIdx) {
            state.displayUsersEndIdx = displayUsersEndIdx;
        },
    },
    getters: {
        displayUsersStartIdx: state => state.displayUsersStartIdx,
        displayUsersEndIdx: state => state.displayUsersEndIdx,
    },
};
