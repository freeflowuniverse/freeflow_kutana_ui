export default {
    state: {
        wallpaperDataUrl: null,
        backgroundTrack: null,
    },
    mutations: {
        setWallpaperDataUrl(state, wallpaperDataUrl) {
            state.wallpaperDataUrl = wallpaperDataUrl;
        },
        setBackgroundTrack(state, backgroundTrack) {
            state.backgroundTrack = backgroundTrack;
        },
        stopActiveBackgroundTrack(state) {
            state.backgroundTrack.stop();
        }
    },
    actions: {
        changeCameraBackground({ commit }, wallpaperFile) {
            if (!wallpaperFile) {
                commit('setWallpaperDataUrl', null);
                return;
            }
            const fileReader = new FileReader();
            fileReader.readAsDataURL(wallpaperFile);
            fileReader.onload = function() {
                commit('setWallpaperDataUrl', fileReader.result);
            }
        },
        setBackgroundTrack({ commit }, backgroundTrack) {
            commit('setBackgroundTrack', backgroundTrack);
        },
        stopActiveBackgroundTrack({ commit, getters }) {
            if (!getters.backgroundTrack) {
                return;
            }
            commit('stopActiveBackgroundTrack');
        }
    },
    getters: {
        wallpaperDataUrl: state => state.wallpaperDataUrl,
    },
};
