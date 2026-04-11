import axiosInstance from './AxiosInterceptor';

export default class HttpService {
  async getData(url, config = {}) {
    return axiosInstance.get(url, config);
  }

  async postData(url, data = {}, config = {}) {
    return axiosInstance.post(url, data, config);
  }

  async putData(url, id, data = {}, config = {}) {
    return axiosInstance.patch(`${url}/${id}`, data, config);
  }

  async patchData(url, data = {}, config = {}) {
    return axiosInstance.patch(url, data, config);
  }

  async deleteData(url, id = null, config = {}) {
    if (id !== null && id !== undefined) {
      return axiosInstance.delete(`${url}/${id}`, config);
    }
    return axiosInstance.delete(url, config);
  }

  async deleteDataWithBody(url, data = {}, config = {}) {
    return axiosInstance.delete(url, { ...config, data });
  }

  async postFormData(url, data, config = {}) {
    return axiosInstance.post(url, data, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config.headers || {}),
      },
    });
  }

  async putFormData(url, id, data, config = {}) {
    return axiosInstance.patch(`${url}/${id}`, data, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config.headers || {}),
      },
    });
  }
}
