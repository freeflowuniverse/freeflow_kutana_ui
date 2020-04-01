import Axios from 'axios'
import config from '../../public/config'
 
export default ({
  getTeamInfo(teamName = 'test') {
      console.log(`${config.ffcBackend}api/teams/${teamName}`)
    return Axios.get(`${config.ffcBackend}api/teams/${teamName}`)
  }
})