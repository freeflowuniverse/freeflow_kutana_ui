import Axios from 'axios';
import config from '../../public/config';

export default {
    getTeamInfo(teamName = 'test') {
        return Axios.get(`${config.ffcBackend}api/teams/${teamName}/`);
    },
};
