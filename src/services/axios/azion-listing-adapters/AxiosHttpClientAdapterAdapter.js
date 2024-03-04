// AxiosHttpClientAdapterAdapter.js
import { AxiosHttpClientAdapter } from '../AxiosHttpClientAdapter';

export class AxiosHttpClientAdapterAdapter extends AxiosHttpClientAdapter {
  // Overloaded request method that prints the URL parameter to the console
  static async request(options) {
    console.log('Received:', options.url);

    const url = new URL('http://dummy.com/' + options.url);
    const baseUrl = url.pathname;

    // Remove page and page_size query params
    const queryParams = {};
    url.search.substring(1).split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key !== 'page') { // && key !== 'page_size') {
        queryParams[key] = value;
      }
    });

    console.log(`${baseUrl}?${new URLSearchParams(queryParams)}`)

    // Set page_size to 5
    queryParams.page_size = 50;

    // Make initial request to get total number of services
    const initialResponse = await super.request({
      ...options,
      url: `${baseUrl}?${new URLSearchParams(queryParams)}`
    });

    const totalServices = initialResponse.body.total;
    const services = initialResponse.body.services;

    // Make subsequent requests to fetch remaining services
    let page = 2;
    while (services.length < totalServices) {
      const nextResponse = await super.request({
        ...options,
        url: `${baseUrl}?${new URLSearchParams({ ...queryParams, page })}`
      });

      services.push(...nextResponse.body.services);
      page++;
    }

    // Update the response with all services
    initialResponse.body.services = services;


    console.log('Response:', JSON.stringify(initialResponse, null, 2));
    // Convert the response to the desired format (the caller of request should be adapted to handle the response)
    const formattedResponse = {
      body: {
        count: initialResponse.body.total,
        total_pages: 1, // Assuming only one page for this example
        schema_version: 3,
        links: {
          previous: null,
          next: null
        },
        results: initialResponse.body.services
      }
    };

    // Just print the reformatted responser to the console
    console.log('Formatted results:', JSON.stringify(formattedResponse, null, 2));

    initialResponse.body = formattedResponse.body;

    return initialResponse;
  }
}
