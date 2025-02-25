import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const loadEdgeDNS = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'idnsQueriesEvents',
    limit: 10000,
    fields: [
      'level',
      'ts',
      'qtype',
      'uuid',
      'zoneId',
      'statusCode',
      'resolutionType',
      'solutionId',
      'source'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      uuidEq: filter.uuid,
      sourceEq: filter.source,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const levelMap = {
  ERROR: {
    content: 'Error',
    severity: 'danger',
    icon: 'pi pi-times-circle'
  },
  WARN: {
    content: 'Warning',
    severity: 'warning',
    icon: 'pi pi-exclamation-triangle'
  },
  INFO: {
    content: 'Info',
    severity: 'info',
    icon: 'pi pi-info-circle'
  },
  DEBUG: {
    content: 'Debug',
    severity: 'success',
    icon: 'pi pi-check-circle'
  },
  TRACE: {
    content: 'Trace',
    severity: 'info',
    icon: 'pi pi-code'
  }
}

const qtypeMap = (value) => {
  const defaultText = value
    ? 'Address Mapping record (A Record), also known as a DNS host record, stores a hostname and its corresponding IPv4 address.'
    : '-'

  const mapType = {
    AAAA: 'IP Version 6 Address record (AAAA Record) stores a hostname and its corresponding IPv6 address.',
    ANAME:
      'ALIAS record is a virtual record type created to provide CNAME, like behavior on apex domains.',
    CAA: 'A CAA record allows a DNS domain name holder to specify one or more Certification Authorities (CAs) authorized to issue certificates for that domain or subdomain.',
    CNAME:
      'Canonical Name record (CNAME Record) can be used to alias a hostname to another hostname. When a DNS client requests a record that contains a CNAME, which points to another hostname, the DNS resolution process is repeated with the new hostname.',
    MX: 'Mail exchanger record (MX Record) specifies an SMTP email server for the domain, used to route outgoing emails to an email server.',
    NS: 'NS-records identify the DNS servers responsible (authoritative) for a zone. A zone should contain one NS-record for each of its own DNS servers (primary and secondaries).',
    PTR: 'PTR records are used for the Reverse DNS (Domain Name System) lookup. Using the IP address, you can get the associated domain/hostname. An A record should exist for every PTR record. The usage of a reverse DNS setup for a mail server is a good solution.',
    SRV: 'A Service record (SRV record) is a specification of data in the Domain Name System defining the location. For example: the hostname and port number, of servers for specified services. It’s defined in RFC 2782, and its type code is 33.',
    TXT: 'A TXT record (short for text record) is a type of resource record in the Domain Name System (DNS) used to provide the ability to associate arbitrary text with a host or other name, such as human readable information about a server, network, data center, or other accounting information.'
  }

  return mapType[value] || defaultText
}

const adaptResponse = (response) => {
  const { body } = response
  const [edgeDnsQueriesEvents = {}] = body.data.idnsQueriesEvents

  return {
    level: levelMap[edgeDnsQueriesEvents.level],
    ts: edgeDnsQueriesEvents.ts,
    qtype: edgeDnsQueriesEvents.qtype,
    qTypeDescription: qtypeMap(edgeDnsQueriesEvents.qtype),
    uuid: edgeDnsQueriesEvents.uuid,
    zoneId: edgeDnsQueriesEvents.zoneId,
    statusCode: edgeDnsQueriesEvents.statusCode,
    resolutionType: edgeDnsQueriesEvents.resolutionType,
    solutionId: edgeDnsQueriesEvents.solutionId
  }
}
