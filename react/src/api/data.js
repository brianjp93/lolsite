import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function getProfileIcon(data) {
    var url = `/api/${version}/data/profile-icon/`
    return axios.post(url, data)
}

export default {
    getProfileIcon,
}