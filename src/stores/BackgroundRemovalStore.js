export default {
    state: {
        wallpaperDataUrl: null,
        activeBackground: null,
        backgroundTrack: null,
    },
    mutations: {
        setWallpaperDataUrl(state, wallpaperDataUrl) {
            state.wallpaperDataUrl = wallpaperDataUrl;
        },
        setActiveBackground(state, activeBackground) {
            state.activeBackground = activeBackground;
        },
        setBackgroundTrack(state, backgroundTrack) {
            state.backgroundTrack = backgroundTrack;
        },
        clearActiveBackground(state) {
            clearInterval(state.activeBackground);
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
        setActiveBackground({ commit }, activeBackground) {
            commit('setActiveBackground', activeBackground);
        },
        setBackgroundTrack({ commit }, backgroundTrack) {
            commit('setBackgroundTrack', backgroundTrack);
        },
        clearActiveBackground({ commit, getters }) {
            if (!getters.activeBackground) {
                return;
            }
            commit('clearActiveBackground');
        }
    },
    getters: {
        wallpaperDataUrl: state => state.wallpaperDataUrl,
        activeBackground: state => state.activeBackground,
    },
};
