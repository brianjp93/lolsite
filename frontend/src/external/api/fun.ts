import axios from "axios";

const version = "v1";

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

async function getInspirationalMessage() {
  const url = `/api/${version}/fun/inspirational-message/`;
  const response = await axios.get(url);
  return response.data;
}

const exports = {
  getInspirationalMessage,
};
export default exports;
