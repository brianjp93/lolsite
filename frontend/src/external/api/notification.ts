import axios from "axios";

const version = "v1";

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

function getNotifications(params: Record<string, unknown>) {
  return axios.get(`/api/${version}/notification/`, { params });
}

function markNotifications(data: unknown) {
  return axios.put(`/api/${version}/notification/`, data);
}

const exports = {
  getNotifications,
  markNotifications,
};
export default exports;
