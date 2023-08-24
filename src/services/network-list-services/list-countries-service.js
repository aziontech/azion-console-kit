import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import api from "../axios/makeGraphQl";
import { makeGraphQlBaseUrl } from "./make-graphql-base-url";

export const listContriesService = async () => {
  const payload = {
    query: `query all_countries_with_code {allCountries { name, code2 } }`,
  };

  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeGraphQlBaseUrl()}`,
      method: 'POST',
      body: payload
    }, api)
  
  const resultFormat = adapt(httpResponse);
  return parseHttpResponse(resultFormat)
}

const adapt = (countries) => {
  console.log('countries', countries)
  const countriesFormated = countries.map((countryItem) => {
    const formattedItem = {
      label: countryItem.name,
      value: countryItem.code2,
    };
    return formattedItem;
  })
  return countriesFormated;
}