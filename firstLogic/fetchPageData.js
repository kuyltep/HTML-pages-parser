import axios from "axios";

export async function fetchPageData(url) {
  const response = await axios.get(url, { responseType: "text" });
  return response.data;
}
