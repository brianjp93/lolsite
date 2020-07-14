import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function getNotifications(params) {
    var url = `/api/${version}/notification/`
    return axios.get(url, {params})
}

export default {
    getNotifications,
}
