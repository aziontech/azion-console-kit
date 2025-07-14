const defaultValue = {
  type: 'PageDefault',
  customStatusCode: '-',
  connector: null,
  ttl: 0,
  contentType: 'text/html',
  response: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
<title>Azion - Default error page</title>
<style>
* {
  box-sizing: border-box;
  font-family: Roboto, sans-serif;
  overscroll-behavior: contain;
}
*,
::after,
::before,
button {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}
body {
  margin: 0;
  line-height: 1.5;
  background-color: #171717;
  color: #fff;
  display: block;
}
.container {
  display: flex;
  flex-direction: column;
}
.main {
  width: 100%;
  min-height: calc(100vh - 45px);
  display: flex;
  position: relative;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 2rem 5rem 2rem;
  gap: 3.5rem;
}
.error-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  max-width: 48rem;
}
.error-state {
  width: 100%;
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2.5rem;
}
.error-header__title {
  font-weight: 500;
  font-size: 3rem;
  line-height: 1;
  text-align: center;
  margin: 0;
}
.error-header__description {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 400;
  text-align: center;
  max-width: 36rem;
  color: #b5b5b5;
  margin: 0;
}
.card-details {
  min-width: 32rem;
  width: 100%;
  max-width: 64rem;
  padding: 2.5rem;
  gap: 1rem;
  border-radius: .375rem;
  border: 1px solid #3e3e3e;
}
.card-details__title {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.75rem;
  margin: 0 0 1rem;
}
.card-details__row,
.card-details__row--icon {
  display: flex;
  align-items: center;
  margin-top: 1rem;
  margin-bottom: 0;
  font-size: .875rem;
}
.card-details__row--icon {
  gap: .35rem;
  margin: 1rem 0;
}
.card-details__icon {
  align-items: center;
  display: flex;
}
.card-details__label {
  width: 7rem;
  font-weight: 500;
  line-height: 1.25rem;
  text-align: left;
  margin-right: .75rem;
}
.card-details__value {
  color: #888;
  font-weight: 400;
}
hr {
  border: 0;
  border-top: 1px solid #444;
}
footer {
  padding: .75rem 2rem;
  gap: .5rem;
  width: 100%;
  display: flex;
  margin: 0;
  border-top: 1px solid #3e3e3e;
}
.footer__text {
  font-size: .875rem;
  line-height: 1.25rem;
  color: #b5b5b5;
  width: 100%;
}
@media (max-width:1024px) {
  .card-details {
    max-width: 48rem;
  }
}
@media (max-width:650px) {
  .main {
    padding: 1rem;
    min-height: calc(100vh - 72px);
  }
  .card-details {
    padding: 2rem;
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
  }
  .card-details__row {
    align-items: baseline;
  }
  footer {
    flex-wrap: wrap;
    justify-content: center;
    padding: .75rem 1rem;
    text-align: center;
  }
}
</style>
</head>
<body>
<div class="container">
  <main class="main">
    <div class="error-state">
      <div class="error-header">
        <h1 class="error-header__title">%s</h1>
        <p class="error-header__description">%s</p>
      </div>
    </div>
    <div class="card-details">
      <h5 class="card-details__title">Error Details</h5>
      <p class="card-details__row--icon">
        <span class="card-details__icon">
          <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.78378 2.01351H8.83783V1.06757C8.83783 0.917039 8.77804 0.772676 8.6716 0.666237C8.56516 0.559797 8.42079 0.5 8.27027 0.5C8.11974 0.5 7.97538 0.559797 7.86894 0.666237C7.7625 0.772676 7.7027 0.917039 7.7027 1.06757V2.01351H4.29729V1.06757C4.29729 0.917039 4.2375 0.772676 4.13106 0.666237C4.02462 0.559797 3.88025 0.5 3.72973 0.5C3.5792 0.5 3.43484 0.559797 3.3284 0.666237C3.22196 0.772676 3.16216 0.917039 3.16216 1.06757V2.01351H2.21621C1.66428 2.01351 1.13494 2.23277 0.744666 2.62305C0.354388 3.01333 0.135132 3.54266 0.135132 4.09459V12.4189C0.135132 12.9709 0.354388 13.5002 0.744666 13.8905C1.13494 14.2807 1.66428 14.5 2.21621 14.5H9.78378C10.3357 14.5 10.865 14.2807 11.2553 13.8905C11.6456 13.5002 11.8649 12.9709 11.8649 12.4189V4.09459C11.8649 3.54266 11.6456 3.01333 11.2553 2.62305C10.865 2.23277 10.3357 2.01351 9.78378 2.01351ZM2.21621 3.14865H3.16216V4.09459C3.16216 4.24512 3.22196 4.38949 3.3284 4.49593C3.43484 4.60237 3.5792 4.66216 3.72973 4.66216C3.88025 4.66216 4.02462 4.60237 4.13106 4.49593C4.2375 4.38949 4.29729 4.24512 4.29729 4.09459V3.14865H7.7027V4.09459C7.7027 4.24512 7.7625 4.38949 7.86894 4.49593C7.97538 4.60237 8.11974 4.66216 8.27027 4.66216C8.42079 4.66216 8.56516 4.60237 8.6716 4.49593C8.77804 4.38949 8.83783 4.24512 8.83783 4.09459V3.14865H9.78378C10.0347 3.14865 10.2753 3.24831 10.4527 3.42571C10.6301 3.60311 10.7297 3.84371 10.7297 4.09459V6.17568H1.27027V4.09459C1.27027 3.84371 1.36993 3.60311 1.54733 3.42571C1.72473 3.24831 1.96533 3.14865 2.21621 3.14865ZM9.78378 13.3649H2.21621C1.96533 13.3649 1.72473 13.2652 1.54733 13.0878C1.36993 12.9104 1.27027 12.6698 1.27027 12.4189V7.31081H10.7297V12.4189C10.7297 12.6698 10.6301 12.9104 10.4527 13.0878C10.2753 13.2652 10.0347 13.3649 9.78378 13.3649Z" fill="#F4F4F4"/>
          </svg>
        </span>
        <span class="card-details__value">%s</span>
      </p>
      <p class="card-details__row--icon">
        <span class="card-details__icon">
          <svg width="14" height="23" viewBox="0 0 14 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_115_176)">
              <path d="M7 4.5C5.61553 4.5 4.26215 4.91054 3.11101 5.67971C1.95987 6.44888 1.06266 7.54213 0.532846 8.82121C0.00303295 10.1003 -0.13559 11.5078 0.134506 12.8656C0.404603 14.2235 1.07129 15.4708 2.05025 16.4497C3.02922 17.4287 4.2765 18.0954 5.63437 18.3655C6.99224 18.6356 8.3997 18.497 9.67878 17.9672C10.9579 17.4373 12.0511 16.5401 12.8203 15.389C13.5895 14.2378 14 12.8845 14 11.5C14 9.64348 13.2625 7.86301 11.9497 6.55025C10.637 5.2375 8.85651 4.5 7 4.5ZM12.8022 10.9167H10.6556C10.3839 9.04301 9.59158 7.28327 8.36889 5.83778C9.54159 6.12345 10.5972 6.76492 11.3909 7.67423C12.1846 8.58353 12.6776 9.71612 12.8022 10.9167ZM4.51889 12.0833H9.48111C9.12186 13.9257 8.26362 15.6341 7 17.0222C5.73638 15.6341 4.87814 13.9257 4.51889 12.0833ZM4.51889 10.9167C4.87814 9.07426 5.73638 7.36586 7 5.97778C8.26362 7.36586 9.12186 9.07426 9.48111 10.9167H4.51889ZM5.63111 5.83778C4.40842 7.28327 3.61614 9.04301 3.34445 10.9167H1.19778C1.32239 9.71612 1.81536 8.58353 2.60908 7.67423C3.40281 6.76492 4.45841 6.12345 5.63111 5.83778ZM1.19778 12.06H3.34445C3.61614 13.9337 4.40842 15.6934 5.63111 17.1389C4.46185 16.8546 3.40872 16.2166 2.61534 15.3119C1.82196 14.4071 1.32694 13.2797 1.19778 12.0833V12.06ZM8.36889 17.1389C9.59158 15.6934 10.3839 13.9337 10.6556 12.06H12.8022C12.6822 13.2647 12.1913 14.4025 11.3972 15.3164C10.6031 16.2302 9.54504 16.8752 8.36889 17.1622V17.1389Z" fill="#F4F4F4"/>
            </g>
            <defs>
              <clipPath id="clip0_115_176">
                <rect width="14" height="14" fill="white" transform="translate(0 4.5)" />
              </clipPath>
            </defs>
          </svg>
        </span>
        <span class="card-details__value tooltip" title="%s">%s</span>
      </p>
      <p class="card-details__row--icon">
        <span class="card-details__label">Your IP</span>
        <span class="card-details__value">%s</span>
      </p>
      <hr>
      <p class="card-details__row">
        <span class="card-details__label">Request ID</span>
        <span class="card-details__value" id="request_id_str">%s</span>
      </p>
      <p class="card-details__row">
        <span class="card-details__label">Status Code</span>
        <span class="card-details__value">%s</span>
      </p>
      <p class="card-details__row">
        <span class="card-details__label">Edge Location</span>
        <span class="card-details__value">%s</span>
      </p>
    </div>
  </main>
</div>
</body>
</html>
`
}

export const STATUS_CODE_OPTIONS = [
  {
    id: 1,
    code: 'Default',
    name: 'Default',
    ...defaultValue
  },
  {
    id: 404,
    code: '404',
    name: 'Not Found',
    ...defaultValue
  }
]

export const CODE_OPTIONS = [
  { label: '400', value: 400 },
  { label: '401', value: 401 },
  { label: '403', value: 403 },
  { label: '404', value: 404 },
  { label: '405', value: 405 },
  { label: '406', value: 406 },
  { label: '408', value: 408 },
  { label: '409', value: 409 },
  { label: '410', value: 410 },
  { label: '411', value: 411 },
  { label: '414', value: 414 },
  { label: '415', value: 415 },
  { label: '416', value: 416 },
  { label: '426', value: 426 },
  { label: '429', value: 429 },
  { label: '431', value: 431 },
  { label: '500', value: 500 },
  { label: '501', value: 501 },
  { label: '502', value: 502 },
  { label: '503', value: 503 },
  { label: '504', value: 504 },
  { label: '505', value: 505 }
]
