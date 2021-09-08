import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

function getInspirationalMessage(data) {
    var url = `/api/${version}/fun/inspirational-message/`
    return axios.post(url, data)
}

const exports = {
    getInspirationalMessage,
}
export default exports
