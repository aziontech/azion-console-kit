const DASHBOARDS_TEXTS = {
  data_stream: {
    data_streamed: {
      total_data: {
        description:
          'Quantity of data streamed to the configured connectors in bytes. Displays the total data sent to the stream.'
      }
    },
    data_stream_requests: {
      total_requests: {
        description:
          'Quantity of requests that were processed. Displays the total amount of requests.'
      }
    }
  },
  edge_applications: {
    data_transferred: {
      edge_cache: {
        description:
          'Sum of data transferred through Edge Cache. Displays the data in bytes divided by Data Transferred, Data Transferred In, and Data Transferred Out.'
      },
      edge_offload: {
        description:
          'Percentage of data successfully delivered by the edge without searching for the content on the origin server. Displays the data in percentages.'
      },
      saved_data: {
        description:
          'Sum of data delivered by the edge without searching for the content on the origin server. Displays the data in bytes.'
      },
      missed_data: {
        description:
          'Amount of data delivered by the edge after searching for the content on the origin server. Displays the data in bytes.'
      },
      total_bandwidth_usage: {
        description:
          'Average of bandwidth used while the edge delivers your content. Displays the total amount of bandwidth used.'
      },
      bandwidth_offloaded: {
        description:
          'Percentage of bandwidth successfully delivered by the edge without searching for the content on the origin server. Displays the data in percentages.'
      },
      saved_bandwidth: {
        description:
          'Average of bandwidth delivered by the edge without searching for the content on the origin server. Displays the average of bandwidth saved.'
      },
      missed_bandwidth: {
        description:
          'Average of bandwidth used by the origin server to search for content. Displays the average of bandwidth used.'
      }
    },
    requests: {
      total_requests: {
        description:
          'Quantity of requests made to your domain. Displays the total amount of requests divided by Edge Requests Total, Https Requests Total, and Http Requests Total.'
      },
      requests_offloaded: {
        description:
          'Percentage of requests delivered directly by the edge, without searching for the content on the origin server. Displays the data in percentages.'
      },
      saved_requests: {
        description:
          'Quantity of requests delivered by the edge without searching for the content on the origin server. Displays the total amount of requests saved.'
      },
      missed_requests: {
        description:
          'Amount of requests delivered by the edge after searching for the content on the origin server. Displays the sum of missed requests.'
      },
      total_requests_per_second: {
        description:
          'Average of requests per second made from customers to your domain. Displays the average number of requests per second.'
      },
      requests_per_second_offloaded: {
        description:
          'Percentage of requests per second delivered directly by the edge without searching for the content on the origin server. Displays the average number of offloaded requests per second in percentages.'
      },
      saved_requests_per_second: {
        description:
          'Average of requests per second delivered by the edge without searching for the content on the origin server. Displays the average number of saved requests delivered.'
      },
      missed_requests_per_second: {
        description:
          'Average of requests per second delivered by the edge after searching for the content on the origin server. Displays the average number of missed requests per second.'
      }
    },
    status_codes: {
      http_status_codes_2xx: {
        description:
          'Indicates user requests that were received, understood, accepted, and processed by the server. Displays Requests Status Code 200, Requests Status Code 204, Requests Status Code 206, and Requests Status Code 2xx.'
      },
      http_status_codes_3xx: {
        description:
          'Indicates user requests that were redirected and had to go through another stage to be delivered. Displays Requests Status Code 301, Requests Status Code 302, Requests Status Code 304, and Requests Status Code 3xx.'
      },
      http_status_codes_4xx: {
        description:
          "Indicates errors that have occurred with user's requests. Displays Requests Status Code 400, Requests Status Code 403, Requests Status Code 404, and Requests Status Code 4xx."
      },
      http_status_codes_5xx: {
        description:
          'Indicates the server failed to deliver an apparently valid request. Displays Requests Status Code 500, Requests Status Code 502, Requests Status Code 503, and Requests Status Code 5xx.'
      }
    },
    waf: {
      threats_vs_requests: {
        description:
          'Sum of attacks processed by WAF. Displays the total amount of Waf Requests Blocked, Waf Requests Threats, and Waf Requests Allowed.'
      },
      cross_site_scripting_xss_threats: {
        description:
          'Sum of Cross-Site Scripting attacks against your domains. Displays the total amount of threats.'
      },
      remote_file_inclusion_rfi_threats: {
        description:
          'Sum of Remote File Inclusion attacks against your domains. Displays the total amount of threats.'
      },
      sql_injection_threats: {
        description:
          'Sum of SQL Injection attacks against your domains. Displays the total amount of threats.'
      },
      other_threats: {
        description:
          'Sum of other types of attacks blocked by WAF. Displays the total amount of threats.'
      }
    },
    http_methods: {
      requests_by_method: {
        description:
          'Total requests made to your domain divided by the HTTP method used. Displays methods Requests Http Method Get, Requests Http Method Post, Requests Http Method Head, and Requests Http Method Others.'
      }
    },
    bandwidth_saving: {
      bandwidth_saving: {
        description:
          "Images that were processed and delivered by Image Processor. Displays domains' savings when transmitting images in bytes."
      }
    }
  },
  edge_functions: {
    invocations: {
      total_invocations: {
        description:
          'Quantity of times an edge function has been executed. Displays the total amount of invocations divided by Edge Firewall Invocations and Edge Application Invocations.'
      }
    }
  },
  edge_dns: {
    standard_queries: {
      total_queries: {
        description: 'Quantity of queries your DNS received. Displays the total amount of queries.'
      }
    }
  },
  image_processor: {
    requests: {
      total_requests: {
        description:
          'Quantity of requests made to your content images being processed. Displays the total amount of requests.'
      },
      total_requests_per_second: {
        description:
          'Requests per second made to your content images being processed. Displays the average number of requests per second.'
      }
    }
  },
  tiered_cache: {
    caching_offload: {
      tiered_cache: {
        description:
          'Sum of data transferred through Tiered Cache. Displays the data in bytes divided by Data Transferred Total, Data Transferred In, and Data Transferred Out.'
      },
      tiered_cache_offload: {
        description:
          'Percentage of data successfully delivered by Tiered Cache to the edge without searching for the content on the origin server. Displays the average number of data in percentages.'
      }
    }
  }
}

export default DASHBOARDS_TEXTS
