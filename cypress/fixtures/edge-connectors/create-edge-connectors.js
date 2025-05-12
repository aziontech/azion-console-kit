const edgeStorageResponse = {
  data: {
    id: "123",
    name: "edgeConnectorsMock",
    type: "edge_storage",
    type_properties: {
      bucket: "advanced-filter-graphql",
      prefix: "20241010173031"
    },
    load_balance_method: "off",
    modules: { load_balancer_enabled: true, origin_shield_enabled: true },
    tls: { policy: "preserve" },
    addresses: []
  }
}

const liveIngestResponse = {
  data: {
    id: 121,
    name: "live injest teste e2mock",
    last_editor: "lucastecnico051+consenso@gmail.com",
    last_modified: "2025-05-12T18:16:54.879401Z",
    modules: {
      load_balancer_enabled: true,
      origin_shield_enabled: true
    },
    active: true,
    product_version: "1.0",
    type: "live_ingest",
    addresses: [],
    tls: {
      policy: "preserve"
    },
    load_balance_method: "off",
    connection_preference: [
      "IPv6",
      "IPv4"
    ],
    connection_timeout: 60,
    read_write_timeout: 120,
    max_retries: 0,
    type_properties: {
      endpoint: "us-east-1.azioningest.net"
    }
  }
}

const httpResponse = {
  data: {
    id: 122,
    name: "teste http e2mock",
    last_editor: "lucastecnico051+consenso@gmail.com",
    last_modified: "2025-05-12T18:21:39.460007Z",
    modules: {
      load_balancer_enabled: true,
      origin_shield_enabled: true
    },
    active: true,
    product_version: "1.0",
    type: "http",
    addresses: [
      {
        address: "www.google.com",
        plain_port: 80,
        tls_port: 443,
        server_role: "primary",
        weight: 1,
        active: true,
        max_conns: 0,
        max_fails: 1,
        fail_timeout: 10
      }
    ],
    tls: { policy: "preserve" },
    load_balance_method: "off",
    connection_preference: ["IPv6", "IPv4"],
    connection_timeout: 60,
    read_write_timeout: 120,
    max_retries: 0,
    type_properties: {
      versions: ["http1"],
      host: "www.google.com",
      path: "/",
      following_redirect: true,
      real_ip_header: "191.1765.86.98",
      real_port_header: "8087"
    }
  }
}

const s3Response = {
  data: {
    id: 123,
    name: "teste s3 e2mock",
    last_editor: "lucastecnico051+consenso@gmail.com",
    last_modified: "2025-05-12T18:23:28.193770Z",
    modules: {
      load_balancer_enabled: true,
      origin_shield_enabled: true
    },
    active: true,
    product_version: "1.0",
    type: "s3",
    addresses: [
      {
        address: "www.google.com",
        plain_port: 80,
        tls_port: 443,
        server_role: "primary",
        weight: 1,
        active: true,
        max_conns: 0,
        max_fails: 1,
        fail_timeout: 10
      }
    ],
    tls: { policy: "preserve" },
    load_balance_method: "off",
    connection_preference: ["IPv6", "IPv4"],
    connection_timeout: 60,
    read_write_timeout: 120,
    max_retries: 0,
    type_properties: {
      host: "api.grando.com",
      bucket: "azion-statics",
      path: "/imgs/",
      region: "us-east-1",
      access_key: "${env.S3_ACCESSKEY}",
      secret_key: "${env.S3_SECRETKEY}"
    }
  }
}

export {
  edgeStorageResponse,
  liveIngestResponse,
  httpResponse,
  s3Response
}
