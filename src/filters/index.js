import Vue from 'vue';
import moment from 'moment';

Vue.filter('parseToTime', time => {
    return moment(time).format('h:mm');
});

Vue.filter('truncate', (input, length = 5) => {
    if (input && input.length > length) {
        return input.substring(0, length) + '...';
    } else {
        return input;
    }
});
