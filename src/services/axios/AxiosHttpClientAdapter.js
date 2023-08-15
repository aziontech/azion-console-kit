import api from "./makeApi";

export const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse?.body || null;
    case 201:
      return 'Resource succesfully created';
    case 204:
      return 'Resource succesfully deleted';
    case 400:
      throw new Error('Invalid API request');
    case 403:
      throw new Error('You dont have permision to use make this action at API');
    case 404:
      throw new Error('Resourse not found.');
    case 500:
      throw new Error('Something went wrong, please try again.');
    default:
      throw new Error('Unexpected Error');
  }
}


export class AxiosHttpClientAdapter {
  static async request({ url, method, headers, body }) {
    let axiosResponse
    try {
      axiosResponse = await api.request({
        url: url,
        method: method,
        headers: headers,
        data: body,
      })
    } catch (error) {
      const axiosError = error
      axiosResponse = axiosError.response
    }

    return AxiosHttpClientAdapter.adapt(axiosResponse)
  }

  static adapt(axiosResponse) {
    return {
      body: axiosResponse.data,
      statusCode: axiosResponse.status,
    }
  }
}