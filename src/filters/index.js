import Vue from 'vue';
import moment from 'moment'

Vue.filter('parseToTime', (time) => {
    return moment(time).format('h:mm');
})