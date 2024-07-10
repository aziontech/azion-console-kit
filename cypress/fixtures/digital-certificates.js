function buildCertificate() {
  let certificateLines = [
    '-----BEGIN CERTIFICATE-----',
    'MIID1jCCAr4CCQCJ1oxagkgUoTANBgkqhkiG9w0BAQsFADCBrDELMAkGA1UEBhMC',
    'QlIxFTATBgNVBAgMDFPDg8KjbyBQYXVsbzEaMBgGA1UEBwwRUmliZWlyw4PCo28g',
    'UHJldG8xETAPBgNVBAoMCE1hcmF0b25hMRIwEAYDVQQLDAlNYXJhdG9uYXMxIDAe',
    'BgNVBAMMF3d3dy5tYXJhdG9uYXRyYWluZWUuY29tMSEwHwYJKoZIhvcNAQkBFhJw',
    'ZXRlcnNvbkBnbWFpbC5jb20wHhcNMjMwODI4MjAzMjA0WhcNMjMwOTI3MjAzMjA0',
    'WjCBrDELMAkGA1UEBhMCQlIxFTATBgNVBAgMDFPDg8KjbyBQYXVsbzEaMBgGA1UE',
    'BwwRUmliZWlyw4PCo28gUHJldG8xETAPBgNVBAoMCE1hcmF0b25hMRIwEAYDVQQL',
    'DAlNYXJhdG9uYXMxIDAeBgNVBAMMF3d3dy5tYXJhdG9uYXRyYWluZWUuY29tMSEw',
    'HwYJKoZIhvcNAQkBFhJwZXRlcnNvbkBnbWFpbC5jb20wggEiMA0GCSqGSIb3DQEB',
    'AQUAA4IBDwAwggEKAoIBAQCb6HG0sFxU/d7vLzZ/NMhaWN+LBbKkUH7vm3bncM+V',
    'FkzuR670NsnAfs7TBmxPDaXEh3lu6Z/IXq1FXm501wqXtZnQ2ZEOdL+TrqnfSaps',
    'Lba8xtGKczOCE265DC+J0iSzX94C18l5SCSZo4HnTlq9t/FoGZqa83KVMSnMwPRs',
    'EhLercj7OHwDrTfdb1n9/LGZ3kWvF4GCcKH/zvvl9xIokzzV7247nPEuWq6qy99Q',
    '2tioU+W0iRrQoPBzs47dWal14ASubIBrtxmRRZIIwquvnvL8NMmKjtVTUl3kzxon',
    'Fe83WWkJHkkPETZp0aQQW16TUiyQj4wLz8vYP4/o1/nvAgMBAAEwDQYJKoZIhvcN',
    'AQELBQADggEBAAgaOMVgV4YrahqiewMDA+i7koIf3wSM4DAC8yY1lUBcFUMPphmi',
    'vuVXVWPIs6WwmIiCp+3yGufhvl06bH8Vch2Ee8QTIZRT5pgZYFTuC0q923qdB8mj',
    'LVPuY6wGHRs2J7NCsEQtgpz29zWM+sDDR3NvF2ZZ7poDHCkuAlNdtWVZ1e81aQFc',
    '78VvxVxRsX59/+3tXPWgwQcnP+AKyuOwiBO7LoF4pq4dqncX0leaMf9JNG+/YVHo',
    'HyBQEjUUFYN0K6rGFXo3TV/Te+BEMdP/7V+k62aTXoXSF/gLbVvaZA5sKtCzqFhl',
    'Xx7Nct3NjdhriLe0i2JH4aAJm9RN4JJyKcY=',
    '-----END CERTIFICATE-----'
  ]

  return certificateLines.join('\n')
}
let templateCertificate = buildCertificate()

export default {
  templateCertificate
}
