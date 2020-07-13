import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function getNotifications(data) {
    var url = `/api/${version}/notification/`
    return axios.get(url, data)
}

export default {
    getNotifications,
}
