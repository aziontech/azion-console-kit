import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from "./errors";
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
      throw new InvalidApiRequestError().message;
    case 401:
      throw new InvalidApiTokenError().message;
    case 403:
      throw new PermissionError().message;
    case 404:
      throw new NotFoundError().message;
    case 500:
      throw new InternalServerError().message;
    default:
      throw new UnexpectedError().message;
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