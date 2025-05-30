const payloadRequestWorkload = {
  data: {
    id: 2312312,
    name: 'domain140525103151708',
    alternate_domains: [],
    edge_application: 1747227912,
    edge_firewall: 83448,
    active: true,
    mtls: {
      verification: "enforce",
      certificate: null,
      crl: null
    },
    protocols: {
      http: {
        versions: ['http1', 'http2', 'http3'],
        http_ports: [80, 8080, 8880],
        https_ports: [443, 9440, 9442],
        quic_ports: [443]
      }
    },
    domains: [
      {
        domain: 'ql0y2ldwl7.map.azionedge.net',
        allow_access: true
      }
    ],
    network_map: '1',
    tls: {
      minimum_version: 'tls_1_1',
      certificate: 25944,
      ciphers: 'TLSv1.2_2019'
    },
    product_version: "1.0"
  }
}

export default {
  payloadRequestWorkload
}
