<template>
    <div class="vue-aspect-ratio" :style="componentStyle">
        <div class="vue-aspect-ratio__inner" :style="innerStyle">
            <div class="vue-aspect-ratio__content">
                <slot class="vue-aspect-ratio-slot" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "VueAspectRatio",
    props: {
        ar: {
            type: String,
            default: "1:1",
            validator: (v) => {
                const [w, h] = v.split(":").map(v => parseInt(v))
                return !Number.isNaN(w) && !Number.isNaN(h)
            }
        },
        width: String
    },
    data() {
        return {
            w: null,
            h: null
        }
    },
    computed: {
        componentStyle() {
            return this.width ? {width: this.width} : {maxWidth: `calc(${(this.w / this.h) * 100}vh)`}
        },
        innerStyle() {
            return {
                paddingTop: (this.h / this.w) * 100 + "%"
            }
        }
    },
    created() {
        const [w, h] = this.ar.split(":").map(v => parseInt(v))
        this.w = w
        this.h = h
    }
}
</script>

<style scoped>

.vue-aspect-ratio-slot {
    width: 100%;
    height: 100%;
}

.vue-aspect-ratio__inner {
    position: relative;
}
.vue-aspect-ratio__content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>