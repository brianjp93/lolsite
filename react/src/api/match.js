import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

function timeline(data) {
    var url = `/api/${version}/match/timeline/`
    return axios.post(url, data)
}

export default {
    timeline,
}