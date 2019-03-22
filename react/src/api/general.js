import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function demoLogin(data) {
    var url = `/api/${version}/general/demo-login/`
    return axios.post(url, data)
}

export default {
    demoLogin,
}