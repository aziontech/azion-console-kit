import { formatBytes } from './format-bytes'

export const gradeTranslate = (score) => {
  let letter = '';

  if (!score) return letter;

  if (score >= 90) {
    letter = 'A';
  } else if (score >= 80 && score <= 89) {
    letter = 'B';
  } else if (score >= 70 && score <= 79) {
    letter = 'C';
  } else if (score >= 60 && score <= 69) {
    letter = 'D';
  } else if (score >= 0 && score <= 59) {
    letter = 'F';
  }

  return letter;
};

export const resultparse = {
  cdn: (test) => {
    return test.data.median.firstView.base_page_cdn || '';
  },

  url: (test) => {
    const requests = test.data.median.firstView.requests || [];
    let url = 'unknown url';

    if (!requests.length) return;

    for (let index = 0; index < requests.length; index++) {
      let request = requests[index];

      if (request.contentType !== 'text/html') {
        continue;
      }

      url = request.documentURL;
      break;
    }

    return url;
  },

  bytesRequestType: (test) => {
    let data = {
      "html/requests": 0,
      "html/bytes": 0,
      "html/uncompressed": 0,

      "css/requests": 0,
      "css/bytes": 0,
      "css/uncompressed": 0,

      "javascript/requests": 0,
      "javascript/bytes": 0,
      "javascript/uncompressed": 0,

      "image/requests": 0,
      "image/bytes": 0,
      "image/uncompressed": 0,

      "video/requests": 0,
      "video/bytes": 0,
      "video/uncompressed": 0,

      "font/requests": 0,
      "font/bytes": 0,
      "font/uncompressed": 0,

      "json/requests": 0,
      "json/bytes": 0,
      "json/uncompressed": 0,

      "others/requests": 0,
      "others/bytes": 0,
      "others/uncompressed": 0
    };

    const requests = test.data.median.firstView.requests || [];
    requests.forEach((request) => {
      let type, mimetype;

      if (!request.contentType) return;

      type = Array.isArray(request.contentType) && !request.contentType.length ? 'other' : request.contentType;

      if (!type.length) return;

      if (/(html)/i.test(type)) {
        mimetype = 'html';
      } else if (/(css)/i.test(type)) {
        mimetype = 'css';
      } else if (/(javascript)/i.test(type)) {
        mimetype = 'javascript';
      } else if (/(image)/i.test(type)) {
        mimetype = 'image';
      } else if (/(video)/i.test(type)) {
        mimetype = 'video';
      } else if (/(font)/i.test(type)) {
        mimetype = 'font';
      } else if (/(json)/i.test(type)) {
        mimetype = 'json';
      } else {
        mimetype = 'others';
      }

      data[`${mimetype}/requests`] += 1;
      data[`${mimetype}/bytes`] += request.objectSize || 0;
      data[`${mimetype}/uncompressed`] = request.objectSizeUncompressed || 0;
    });

    return data;
  },

  possibleSave: (test) => {
    let possible = test.data.median.firstView.image_savings || 0;
    let total = test.data.median.firstView.image_total || 0;

    return `${formatBytes(possible)} of ${formatBytes(total)}`;
  },

  percentilImageSave: (test) => {
    let possible = test.data.median.firstView.image_savings || 0;
    let total = test.data.median.firstView.image_total || 0;

    return Number(((100 * possible) / total).toFixed(2));
  },

  cart: (test) => {
    let hasCart = test.data.median.firstView.detected['Ecommerce'] || undefined;
    return hasCart ? true : false;
  },

  grade: (test) => {
    let grade = {};
    let secHeaders = test.data.median.firstView.securityHeaders;

    grade.security = secHeaders && secHeaders.securityHeadersGrade ? secHeaders.securityHeadersGrade : '';
    grade.ttfb = `${test.data.median.firstView.TTFB}ms`;
    grade['score_keep-alive'] = gradeTranslate(test.data.median.firstView['score_keep-alive']);
    grade.score_gzip = gradeTranslate(test.data.median.firstView.score_gzip);
    grade.score_compress = gradeTranslate(test.data.median.firstView.score_compress);
    grade.score_progressive_jpeg = gradeTranslate(test.data.median.firstView.score_progressive_jpeg);
    grade.score_cache = gradeTranslate(test.data.median.firstView.score_cache);
    grade.cdn = gradeTranslate(test.data.median.firstView.score_cdn);

    return grade;
  }
};