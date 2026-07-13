# Certificate (edge_certificate)

```bash
# POST (create)
curl -s -X POST 'https://stage-tls-api.azion.net/digital_certificates/api/certificates' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json; version=4' \
  -d '{"name":"my-certificate","certificate":"-----BEGIN CERTIFICATE-----\nMIIDUzCCAjugAwIBAgIUXYYKPNSAXTghtt1IeD+hZKDx5lowDQYJKoZIhvcNAQEL\nBQAwFjEUMBIGA1UEAwwLZXhhbXBsZS5jb20wHhcNMjYwNjE1MTE1NDUxWhcNMjcw\nNjE1MTE1NDUxWjAWMRQwEgYDVQQDDAtleGFtcGxlLmNvbTCCASIwDQYJKoZIhvcN\nAQEBBQADggEPADCCAQoCggEBAJV9emFZLg9AeaM2wQhysacV3OrxIpiFArs4YJjo\neckuDHRJkVden3ZSmOXPuVzECrmBR9PrJ7sJOTmKzLTfzkbIAjXSOkAmVZieKR1t\n80LTPJBdqeaBAW8QEAadmpZvmM7otrtddqomKDqQgSzTTErYFIYHWBdRb7OISWLc\nqX9fOql2mltX71QtDgM+wyQ9F5qEhC2c3ClX/WbO6fVldl14ygJ/F+fc5nup5XJU\nPsKIsp5uzCRmlsTanycQ4JeIY5/XqLPOaXjeFttaNBknESO5XwxGWGnhmixMg9g5\ngI/zn4M9keNnAfpKTgE+UAI2RBRXMzuhDNuRAk8A9BvI73UCAwEAAaOBmDCBlTAd\nBgNVHQ4EFgQUWNeGMfAb5cYHLD34aaoAbDsFY9gwHwYDVR0jBBgwFoAUWNeGMfAb\n5cYHLD34aaoAbDsFY9gwFgYDVR0RBA8wDYILZXhhbXBsZS5jb20wHQYDVR0lBBYw\nFAYIKwYBBQUHAwEGCCsGAQUFBwMCMA4GA1UdDwEB/wQEAwIFoDAMBgNVHRMBAf8E\nAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQB81rFqfebM7iaGywPQj5y4LKmDKPh94BTw\n3/zZD0u4Q/9rlTkNLgFTTA5illmnVhqmDtPI1OkTefrhWLZu0q6aMa19CSMuV9Qu\nZnuQc97y+U5r8wcpWmCacoARlKc2I13whdVQhD+fDFSKKopmfYYUArz13pIKmaBt\nJIk7TgucCEwlTCDjDMDH/6Q1ZrWAzqLV8QCnVPCAiGHbFwMnwe7ZI7IiaM8CNp49\naB0fW7IvJ4q9Tv7YEOukH5EMLink1LvUzJHyh8FW4yy7OPFGg1wXTzRyoCh15Xlo\n64rE2m7N2haLPdTIg0dGShJ8/w9vDoNMULRATbKUYoK47Cy2Nuve\n-----END CERTIFICATE-----\n","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVfXphWS4PQHmj\nNsEIcrGnFdzq8SKYhQK7OGCY6HnJLgx0SZFXXp92Upjlz7lcxAq5gUfT6ye7CTk5\nisy0385GyAI10jpAJlWYnikdbfNC0zyQXanmgQFvEBAGnZqWb5jO6La7XXaqJig6\nkIEs00xK2BSGB1gXUW+ziEli3Kl/XzqpdppbV+9ULQ4DPsMkPReahIQtnNwpV/1m\nzun1ZXZdeMoCfxfn3OZ7qeVyVD7CiLKebswkZpbE2p8nEOCXiGOf16izzml43hbb\nWjQZJxEjuV8MRlhp4ZosTIPYOYCP85+DPZHjZwH6Sk4BPlACNkQUVzM7oQzbkQJP\nAPQbyO91AgMBAAECggEAQ/dHP2BhAR0y0IKR9AnVfJ6DkSvuK0L6MW3Z+VtlF5NA\npVRXaM5EGPNHweCWKbeWGq5NHmwhZbe1VVSmaqwAqIzB+H9q7YSgUSHDlrZJLf5F\nYGu9VegcY0b9ykw4nyIA6z3B6uD9FTIBA1N075Dn9HVWq3NGWV+0tf8GQpUJ2Tcc\nWcMkOrs6eYJpTSz8PacwX7ikuVtv2HhkgdQJFpXOiCPifaWBOvGTU3B5+LmU6thZ\nbRri9sY8nGMqVDRZxIzMY7kiiN7e6XAiEovczy5KvvnHePBXfseKF0Zf2uVYLNgK\n3163TZnMkeQKOrTs6gqLrlK0pIufJ5oWa3FiZgeWBwKBgQDGHhiwLL+YJWzaDzHy\n95K6Mag2s5oWbT+nSHic6Uy8mziUv/ctfKvQlHPTCgBhpFex0GLdA3Z0xuZvE4ev\npxChjDH4fghq1XiX3KjZVFZsa/PFvJcG/ezq3DFjLBWVdUWZZwp///IkuXGQpdY2\nFIPsYAwtadoJVhT3gYTy9lmnLwKBgQDBKl4bsB9i1K+WoJNlsFdV1j2AAheNw/aC\n6/+cwCf97e1PjMnMGFX9D3XYCwAwVSdqt+dBgyNwRxifewdoEGBhf4yQcUi2sZkX\nyV6XwYlUUc1WCGOQ/XELlHCNjB0EyYe2Rfm3Dz4mwvLQbr/URs4OpqIkWPs5KC1z\nQl3LHl0qmwKBgGLZQ2IrgZDtI2mNaVOb+QaTniVk6T3FVpwliaBouxPjspBtU2vL\np4JTf5LNi7EsKWEb4yf5AVJ0pybGrM2UYrTn2Urtv09moVvMCicdcF16Y0/Gr+ga\nK+pm4PFlXoOK1qYahl+lGXD/Yc1VIRMsm0IGDi1egh5kZ+OyKN580fCbAoGAHnJp\nJwAZ0mAn1Rw2X37uJS+Bvh2WTNgokPZV8gUvyIyqLTHJ1Qu48gxvzL/fJb8mWWHn\nZ6IeAeKS9QBVaIe8SWHrbBEPHwzbTq6E5HKzDMFgFkF4QDBSkzqwiv8cy9ZgN9DL\nzZjvePidgVETl4gZjqGhSQ1le9rjXxmE4zFECiUCgYEAuCz8VBuhPolfB9SqNMBQ\nTtNEgbGurzztU3LPVncY+yzsl9ba12QeT/OwFXfy7/TUpG6ftmg4MrPQtQnEvTom\nCNAFONIIbcRBwgOaDwiUzZaQIVXvqMNQkUUJc7TE7IjBdydSaX5memOre3hjwcvD\nWU2orKtPqcT/g7Lnv8cbTMk=\n-----END PRIVATE KEY-----\n","type":"edge_certificate"}'

# GET (retrieve — private_key e write-only, nao retorna)
curl -s -X GET 'https://stage-tls-api.azion.net/digital_certificates/api/certificates/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json; version=4'

# PUT (update — promove nova versao)
curl -s -X PUT 'https://stage-tls-api.azion.net/digital_certificates/api/certificates/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json; version=4' \
  -d '{"name":"my-certificate-edit","certificate":"-----BEGIN CERTIFICATE-----\nMIIDUzCCAjugAwIBAgIUXYYKPNSAXTghtt1IeD+hZKDx5lowDQYJKoZIhvcNAQEL\nBQAwFjEUMBIGA1UEAwwLZXhhbXBsZS5jb20wHhcNMjYwNjE1MTE1NDUxWhcNMjcw\nNjE1MTE1NDUxWjAWMRQwEgYDVQQDDAtleGFtcGxlLmNvbTCCASIwDQYJKoZIhvcN\nAQEBBQADggEPADCCAQoCggEBAJV9emFZLg9AeaM2wQhysacV3OrxIpiFArs4YJjo\neckuDHRJkVden3ZSmOXPuVzECrmBR9PrJ7sJOTmKzLTfzkbIAjXSOkAmVZieKR1t\n80LTPJBdqeaBAW8QEAadmpZvmM7otrtddqomKDqQgSzTTErYFIYHWBdRb7OISWLc\nqX9fOql2mltX71QtDgM+wyQ9F5qEhC2c3ClX/WbO6fVldl14ygJ/F+fc5nup5XJU\nPsKIsp5uzCRmlsTanycQ4JeIY5/XqLPOaXjeFttaNBknESO5XwxGWGnhmixMg9g5\ngI/zn4M9keNnAfpKTgE+UAI2RBRXMzuhDNuRAk8A9BvI73UCAwEAAaOBmDCBlTAd\nBgNVHQ4EFgQUWNeGMfAb5cYHLD34aaoAbDsFY9gwHwYDVR0jBBgwFoAUWNeGMfAb\n5cYHLD34aaoAbDsFY9gwFgYDVR0RBA8wDYILZXhhbXBsZS5jb20wHQYDVR0lBBYw\nFAYIKwYBBQUHAwEGCCsGAQUFBwMCMA4GA1UdDwEB/wQEAwIFoDAMBgNVHRMBAf8E\nAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQB81rFqfebM7iaGywPQj5y4LKmDKPh94BTw\n3/zZD0u4Q/9rlTkNLgFTTA5illmnVhqmDtPI1OkTefrhWLZu0q6aMa19CSMuV9Qu\nZnuQc97y+U5r8wcpWmCacoARlKc2I13whdVQhD+fDFSKKopmfYYUArz13pIKmaBt\nJIk7TgucCEwlTCDjDMDH/6Q1ZrWAzqLV8QCnVPCAiGHbFwMnwe7ZI7IiaM8CNp49\naB0fW7IvJ4q9Tv7YEOukH5EMLink1LvUzJHyh8FW4yy7OPFGg1wXTzRyoCh15Xlo\n64rE2m7N2haLPdTIg0dGShJ8/w9vDoNMULRATbKUYoK47Cy2Nuve\n-----END CERTIFICATE-----\n","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVfXphWS4PQHmj\nNsEIcrGnFdzq8SKYhQK7OGCY6HnJLgx0SZFXXp92Upjlz7lcxAq5gUfT6ye7CTk5\nisy0385GyAI10jpAJlWYnikdbfNC0zyQXanmgQFvEBAGnZqWb5jO6La7XXaqJig6\nkIEs00xK2BSGB1gXUW+ziEli3Kl/XzqpdppbV+9ULQ4DPsMkPReahIQtnNwpV/1m\nzun1ZXZdeMoCfxfn3OZ7qeVyVD7CiLKebswkZpbE2p8nEOCXiGOf16izzml43hbb\nWjQZJxEjuV8MRlhp4ZosTIPYOYCP85+DPZHjZwH6Sk4BPlACNkQUVzM7oQzbkQJP\nAPQbyO91AgMBAAECggEAQ/dHP2BhAR0y0IKR9AnVfJ6DkSvuK0L6MW3Z+VtlF5NA\npVRXaM5EGPNHweCWKbeWGq5NHmwhZbe1VVSmaqwAqIzB+H9q7YSgUSHDlrZJLf5F\nYGu9VegcY0b9ykw4nyIA6z3B6uD9FTIBA1N075Dn9HVWq3NGWV+0tf8GQpUJ2Tcc\nWcMkOrs6eYJpTSz8PacwX7ikuVtv2HhkgdQJFpXOiCPifaWBOvGTU3B5+LmU6thZ\nbRri9sY8nGMqVDRZxIzMY7kiiN7e6XAiEovczy5KvvnHePBXfseKF0Zf2uVYLNgK\n3163TZnMkeQKOrTs6gqLrlK0pIufJ5oWa3FiZgeWBwKBgQDGHhiwLL+YJWzaDzHy\n95K6Mag2s5oWbT+nSHic6Uy8mziUv/ctfKvQlHPTCgBhpFex0GLdA3Z0xuZvE4ev\npxChjDH4fghq1XiX3KjZVFZsa/PFvJcG/ezq3DFjLBWVdUWZZwp///IkuXGQpdY2\nFIPsYAwtadoJVhT3gYTy9lmnLwKBgQDBKl4bsB9i1K+WoJNlsFdV1j2AAheNw/aC\n6/+cwCf97e1PjMnMGFX9D3XYCwAwVSdqt+dBgyNwRxifewdoEGBhf4yQcUi2sZkX\nyV6XwYlUUc1WCGOQ/XELlHCNjB0EyYe2Rfm3Dz4mwvLQbr/URs4OpqIkWPs5KC1z\nQl3LHl0qmwKBgGLZQ2IrgZDtI2mNaVOb+QaTniVk6T3FVpwliaBouxPjspBtU2vL\np4JTf5LNi7EsKWEb4yf5AVJ0pybGrM2UYrTn2Urtv09moVvMCicdcF16Y0/Gr+ga\nK+pm4PFlXoOK1qYahl+lGXD/Yc1VIRMsm0IGDi1egh5kZ+OyKN580fCbAoGAHnJp\nJwAZ0mAn1Rw2X37uJS+Bvh2WTNgokPZV8gUvyIyqLTHJ1Qu48gxvzL/fJb8mWWHn\nZ6IeAeKS9QBVaIe8SWHrbBEPHwzbTq6E5HKzDMFgFkF4QDBSkzqwiv8cy9ZgN9DL\nzZjvePidgVETl4gZjqGhSQ1le9rjXxmE4zFECiUCgYEAuCz8VBuhPolfB9SqNMBQ\nTtNEgbGurzztU3LPVncY+yzsl9ba12QeT/OwFXfy7/TUpG6ftmg4MrPQtQnEvTom\nCNAFONIIbcRBwgOaDwiUzZaQIVXvqMNQkUUJc7TE7IjBdydSaX5memOre3hjwcvD\nWU2orKtPqcT/g7Lnv8cbTMk=\n-----END PRIVATE KEY-----\n","type":"edge_certificate"}'

# DELETE
curl -s -X DELETE 'https://stage-tls-api.azion.net/digital_certificates/api/certificates/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json; version=4'
```

# Trusted CA (trusted_ca_certificate)

```bash
# POST (create — sem private_key)
curl -s -X POST 'https://stage-tls-api.azion.net/digital_certificates/api/certificates' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json; version=4' \
  -d '{"name":"my-trusted-ca","certificate":"-----BEGIN CERTIFICATE-----\nMIIDHjCCAgagAwIBAgIUZvTs7v+lPdiWb6Olg/kSc4FDb/kwDQYJKoZIhvcNAQEL\nBQAwFTETMBEGA1UEAwwKTXkgUm9vdCBDQTAeFw0yNjA2MTUxMTU0NTJaFw0zNjA2\nMTIxMTU0NTJaMBUxEzARBgNVBAMMCk15IFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEB\nAQUAA4IBDwAwggEKAoIBAQC7Vr5rITOiQq1ao4p4avjrjLyaPFYgmUuQEwn0JwpU\nSYUwWF/mJq45MiDAE/d+V0RR79nW1VJPExWllq754j4msQpEIXmenxzGJ7RiCUAx\np0XLGOBTrzFpiDDW5l+k1kc1JYj6vYkiQDXnnFesLG2As0+yoy0jm0mnjjJsG/Qb\n2Jo5j+WwrzBUHGYxSxfu3JhOUBwwtSoifO5+BysKDmQ727jjLKvO70jw+VP6MBeR\nJ3mcSdSAc/0kUvMIcTee8JszdsTjzId4OUvcrADVo8PPD4MiDWidtcab+24ssqGB\nbe3uaFPzamyzcfh+2VWSU/pRMwqBuFFrpcXct5izdoa/AgMBAAGjZjBkMB0GA1Ud\nDgQWBBRLglv7v0iA63QGQi2EZc64MTZYSzAfBgNVHSMEGDAWgBRLglv7v0iA63QG\nQi2EZc64MTZYSzAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAN\nBgkqhkiG9w0BAQsFAAOCAQEAD8zxalndmdGzXfjQ46+t3q3eA3Esd5BzmQYY53TN\nxu5B+Z03S2Ly7JNI5UOFKBHwdfp+26Ih7yUgRF5Prnf47UQ3FbKfATLrlc07stBz\nm5vKXxMF2l6OZXUXx0MQBY+R1bFv+upf1/SXE1w2gT/YljzNopbhBrHC4J0PIy1g\nVPB9bM+tEUXJuu3J/6BWa387j1yp/KaaaTAwaMtrant3dZk5qu4T4Be6nlZ4u1/L\ntzBhb/IUGiKyT3uQtN1o09W3iQTlPltvjWRVAIu+hUQaKvXtpmpd3Dq9cVtnLRyQ\nObLYc3eb+T4ieVSn0bPl9rbCin3yLZjbhJjvjhbqCo+gng==\n-----END CERTIFICATE-----\n","type":"trusted_ca_certificate"}'

# GET (retrieve)
curl -s -X GET 'https://stage-tls-api.azion.net/digital_certificates/api/certificates/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json; version=4'

# PUT (update — promove nova versao)
curl -s -X PUT 'https://stage-tls-api.azion.net/digital_certificates/api/certificates/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json; version=4' \
  -d '{"name":"my-trusted-ca-edit","certificate":"-----BEGIN CERTIFICATE-----\nMIIDHjCCAgagAwIBAgIUZvTs7v+lPdiWb6Olg/kSc4FDb/kwDQYJKoZIhvcNAQEL\nBQAwFTETMBEGA1UEAwwKTXkgUm9vdCBDQTAeFw0yNjA2MTUxMTU0NTJaFw0zNjA2\nMTIxMTU0NTJaMBUxEzARBgNVBAMMCk15IFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEB\nAQUAA4IBDwAwggEKAoIBAQC7Vr5rITOiQq1ao4p4avjrjLyaPFYgmUuQEwn0JwpU\nSYUwWF/mJq45MiDAE/d+V0RR79nW1VJPExWllq754j4msQpEIXmenxzGJ7RiCUAx\np0XLGOBTrzFpiDDW5l+k1kc1JYj6vYkiQDXnnFesLG2As0+yoy0jm0mnjjJsG/Qb\n2Jo5j+WwrzBUHGYxSxfu3JhOUBwwtSoifO5+BysKDmQ727jjLKvO70jw+VP6MBeR\nJ3mcSdSAc/0kUvMIcTee8JszdsTjzId4OUvcrADVo8PPD4MiDWidtcab+24ssqGB\nbe3uaFPzamyzcfh+2VWSU/pRMwqBuFFrpcXct5izdoa/AgMBAAGjZjBkMB0GA1Ud\nDgQWBBRLglv7v0iA63QGQi2EZc64MTZYSzAfBgNVHSMEGDAWgBRLglv7v0iA63QG\nQi2EZc64MTZYSzAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAN\nBgkqhkiG9w0BAQsFAAOCAQEAD8zxalndmdGzXfjQ46+t3q3eA3Esd5BzmQYY53TN\nxu5B+Z03S2Ly7JNI5UOFKBHwdfp+26Ih7yUgRF5Prnf47UQ3FbKfATLrlc07stBz\nm5vKXxMF2l6OZXUXx0MQBY+R1bFv+upf1/SXE1w2gT/YljzNopbhBrHC4J0PIy1g\nVPB9bM+tEUXJuu3J/6BWa387j1yp/KaaaTAwaMtrant3dZk5qu4T4Be6nlZ4u1/L\ntzBhb/IUGiKyT3uQtN1o09W3iQTlPltvjWRVAIu+hUQaKvXtpmpd3Dq9cVtnLRyQ\nObLYc3eb+T4ieVSn0bPl9rbCin3yLZjbhJjvjhbqCo+gng==\n-----END CERTIFICATE-----\n","type":"trusted_ca_certificate"}'

# DELETE
curl -s -X DELETE 'https://stage-tls-api.azion.net/digital_certificates/api/certificates/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json; version=4'
```

# CRL (certificate revocation list)

```bash
# POST (create)
curl -s -X POST 'https://stage-tls-api.azion.net/digital_certificates/api/crls' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json; version=4' \
  -d '{"name":"my-crl","crl":"-----BEGIN X509 CRL-----\nMIIBbjBYAgEBMA0GCSqGSIb3DQEBCwUAMBUxEzARBgNVBAMMCk15IFJvb3QgQ0EX\nDTI2MDYxNTExNTQ1MloXDTI2MDcxNTExNTQ1MlqgDzANMAsGA1UdFAQEAgIQADAN\nBgkqhkiG9w0BAQsFAAOCAQEAf5e4UfZQfqB3TsDZsLV0bFyH2fHlKdB8aElwWiiH\nq8zCFwtw1mKLdti9udUJK9baDrH+iOxz18V0gfh9ySEHBOU44ZW1urfXVWDNuVAZ\nKTorj6pb2DGHxiMWB2W0zKlVJ5yHhMh6tZT/2r0Q3DmjrSecPpwfDdLzbYs+NrMa\n2nhYSCvjaaKGNRctMw+2r6ZfzHPC7ppMNkhxm73BeQbSdPX+K5+7Xv8BgoytD/eQ\nId7olL7MgBHRgSpsZ5oBcxgyeCGZC5FXFY++wNtlcOdezIhtqMV560vQBwT1iwGb\nP32GnTRAqwzvRBs3idzig8PZsD8C/C5UyLCrQffS8QVpeQ==\n-----END X509 CRL-----\n"}'

# GET (retrieve)
curl -s -X GET 'https://stage-tls-api.azion.net/digital_certificates/api/crls/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json; version=4'

# PUT (update — promove nova versao)
curl -s -X PUT 'https://stage-tls-api.azion.net/digital_certificates/api/crls/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json; version=4' \
  -d '{"name":"my-crl-edit","crl":"-----BEGIN X509 CRL-----\nMIIBbjBYAgEBMA0GCSqGSIb3DQEBCwUAMBUxEzARBgNVBAMMCk15IFJvb3QgQ0EX\nDTI2MDYxNTExNTQ1MloXDTI2MDcxNTExNTQ1MlqgDzANMAsGA1UdFAQEAgIQADAN\nBgkqhkiG9w0BAQsFAAOCAQEAf5e4UfZQfqB3TsDZsLV0bFyH2fHlKdB8aElwWiiH\nq8zCFwtw1mKLdti9udUJK9baDrH+iOxz18V0gfh9ySEHBOU44ZW1urfXVWDNuVAZ\nKTorj6pb2DGHxiMWB2W0zKlVJ5yHhMh6tZT/2r0Q3DmjrSecPpwfDdLzbYs+NrMa\n2nhYSCvjaaKGNRctMw+2r6ZfzHPC7ppMNkhxm73BeQbSdPX+K5+7Xv8BgoytD/eQ\nId7olL7MgBHRgSpsZ5oBcxgyeCGZC5FXFY++wNtlcOdezIhtqMV560vQBwT1iwGb\nP32GnTRAqwzvRBs3idzig8PZsD8C/C5UyLCrQffS8QVpeQ==\n-----END X509 CRL-----\n"}'

# DELETE
curl -s -X DELETE 'https://stage-tls-api.azion.net/digital_certificates/api/crls/<ID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json; version=4'
```
