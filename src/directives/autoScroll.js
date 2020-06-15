import Vue from 'vue'

export default {
    update: el => {
        Vue.nextTick().then(() => {
            el.scrollTop = el.scrollHeight
        })
    }
}