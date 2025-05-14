export const edgeConnectorsdata = {
  count: 1,
  results: [{
    id: 1,
    name: "teste mock",
    last_editor: "lucastecnico051+consenso@gmail.com",
    last_modified: "2025-05-07T17:51:26.634617Z",
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
    tls: {
      policy: "preserve"
    },
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
  }]
}