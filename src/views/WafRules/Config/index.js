export const defaultConditions = [
  { title: 'Any HTTP Header Value', value: 'any_http_header_value' },
  { title: 'Any HTTP Header Name', value: 'any_http_header_name' },
  { title: 'Specific HTTP Header Value', value: 'specific_http_header_value', isField: 'Value' },
  { title: 'Specific HTTP Header Name', value: 'specific_http_header_name', isField: 'Name' },
  { title: 'Any Query String Value', value: 'any_query_string_value' },
  { title: 'Any Query String Name', value: 'any_query_string_name' },
  { title: 'Specific Query String Value', value: 'specific_query_string_value', isField: 'Value' },
  { title: 'Specific Query String Name', value: 'specific_query_string_name', isField: 'Name' },
  { title: 'Body Form Field Value', value: 'body_form_field_value' },
  { title: 'Body Form Field Name', value: 'body_form_field_name' },
  {
    title: 'Specific Body Form Field Value',
    value: 'specific_body_form_field_value',
    isField: 'Value'
  },
  {
    title: 'Specific Body Form Field Name',
    value: 'specific_body_form_field_name',
    isField: 'Name'
  },
  { title: 'Any URL', value: 'any_url' },
  { title: 'Raw Body', value: 'raw_body' },
  { title: 'File Extension', value: 'file_extension' }
]

/* eslint-disable no-useless-escape */

export const optionsRuleIds = [
  { value: 0, text: '0 - All Rules' },
  { value: 1, text: '1 - Validation of protocol compliance: weird request, unable to parse' },
  { value: 2, text: '2 - Request too big, stored on disk and not parsed' },
  { value: 10, text: '10 - Validation of protocol compliance: invalid HEX encoding (null bytes)' },
  {
    value: 11,
    text: '11 - Validation of protocol compliance: missing or unknown Content-Type header in a POST (this rule applies only to Request Body match zone)'
  },
  { value: 12, text: '12 - Validation of protocol compliance: invalid formatted URL' },
  { value: 13, text: '13 - Validation of protocol compliance: invalid POST format' },
  { value: 14, text: '14 - Validation of protocol compliance: invalid POST boundary' },
  { value: 15, text: '15 - Validation of protocol compliance: invalid JSON' },
  { value: 16, text: '16 - Validation of protocol compliance: POST with no body' },
  { value: 17, text: '17 - Possible SQL Injection attack: validation with libinjection_sql' },
  { value: 18, text: '18 - Possible XSS attack: validation with libinjection_xss' },
  {
    value: 1000,
    text: '1000 - Possible SQL Injection attack: SQL keywords found in Body, Path, Query String or Cookies'
  },
  {
    value: 1001,
    text: '1001 - Possible SQL Injection or XSS attack: double quote (") found in Body, Path, Query String or Cookies'
  },
  {
    value: 1002,
    text: '1002 - Possible SQL Injection attack: possible hex encoding (0x) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1003,
    text: '1003 - Possible SQL Injection attack: MySQL comment (/*) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1004,
    text: '1004 - Possible SQL Injection attack: MySQL comment (*/) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1005,
    text: '1005 - Possible SQL Injection attack: MySQL keyword (|) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1006,
    text: '1006 - Possible SQL Injection attack: MySQL keyword (&amp;&amp;) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1007,
    text: '1007 - Possible SQL Injection attack: MySQL comment (--) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1008,
    text: '1008 - Possible SQL Injection or XSS attack: semicolon (;) found in Body, Path or Query String'
  },
  {
    value: 1009,
    text: '1009 - Possible SQL Injection attack: equal sign (=) found in Body or Query String'
  },
  {
    value: 1010,
    text: '1010 - Possible SQL Injection or XSS attack: open parenthesis [(] found in Body, Path, Query String or Cookies'
  },
  {
    value: 1011,
    text: '1011 - Possible SQL Injection or XSS attack: close parenthesis [)] found in Body, Path, Query String or Cookies'
  },
  {
    value: 1013,
    text: "1013 - Possible SQL Injection or XSS attack: apostrophe (') found in Body, Path, Query String or Cookies"
  },
  {
    value: 1015,
    text: '1015 - Possible SQL Injection attack: comma (,) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1016,
    text: '1016 - Possible SQL Injection attack: MySQL comment (#) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1017,
    text: '1017 - Possible SQL Injection attack: double at sign (@@) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1100,
    text: '1100 - Possible RFI attack: scheme "http://" found in Body, Query String or Cookies'
  },
  {
    value: 1101,
    text: '1101 - Possible RFI attack: scheme "https://" found in Body, Query String or Cookies'
  },
  {
    value: 1102,
    text: '1102 - Possible RFI attack: scheme "ftp://" found in Body, Query String or Cookies'
  },
  {
    value: 1103,
    text: '1103 - Possible RFI attack: scheme "php://" found in Body, Query String or Cookies'
  },
  {
    value: 1104,
    text: '1104 - Possible RFI attack: scheme "sftp://" found in Body, Query String or Cookies'
  },
  {
    value: 1105,
    text: '1105 - Possible RFI attack: scheme "zlib://" found in Body, Query String or Cookies'
  },
  {
    value: 1106,
    text: '1106 - Possible RFI attack: scheme "data://" found in Body, Query String or Cookies'
  },
  {
    value: 1107,
    text: '1107 - Possible RFI attack: scheme "glob://" found in Body, Query String or Cookies'
  },
  {
    value: 1108,
    text: '1108 - Possible RFI attack: scheme "phar://" found in Body, Query String or Cookies'
  },
  {
    value: 1109,
    text: '1109 - Possible RFI attack: scheme "file://" found in Body, Query String or Cookies'
  },
  {
    value: 1110,
    text: '1110 - Possible RFI attack: scheme "gopher://" found in Body, Query String or Cookies'
  },
  {
    value: 1198,
    text: '1198 - Possible RCE attack: validation with log4j (Log4Shell) in HEADERS_VAR'
  },
  {
    value: 1199,
    text: '1199 - Possible RCE attack: validation with log4j (Log4Shell) in Body, Path, Query String, Headers or Cookies'
  },
  {
    value: 1200,
    text: '1200 - Possible Directory Traversal attack: double dot (..) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1202,
    text: '1202 - Possible Directory Traversal attack: obvious probe (/etc/passwd) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1203,
    text: `1203 - Possible Directory Traversal attack: obvious windows path (c:\\) found in Body, Path, Query String or Cookies`
  },
  {
    value: 1204,
    text: '1204 - Possible Directory Traversal attack: obvious probe (cmd.exe) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1205,
    text: `1205 - Possible Directory Traversal attack: backslash (\) found in Body, Path, Query String or Cookies`
  },
  {
    value: 1206,
    text: '1206 - Possible Directory Traversal attack: slash (/) found in Body, Query String or Cookies'
  },
  {
    value: 1207,
    text: '1207 - Possible Directory Traversal attack: obvious path probe (/..;/) found in Body, Query String or Cookies'
  },
  {
    value: 1208,
    text: '1208 - Possible Directory Traversal attack: obvious path probe (/.;/) found in Body, Query String or Cookies'
  },
  {
    value: 1209,
    text: '1209 - Possible Directory Traversal attack: obvious path probe (/.%2e/) found in Body, Query String or Cookies'
  },
  {
    value: 1210,
    text: '1210 - Possible Directory Traversal attack: obvious path probe (/%2e./) found in Body, Query String or Cookies'
  },
  {
    value: 1302,
    text: '1302 - Possible XSS attack: html open tag (&lt;) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1303,
    text: '1303 - Possible XSS attack: html close tag (&gt;) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1310,
    text: '1310 - Possible XSS attack: open square bracket ([) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1311,
    text: '1311 - Possible XSS attack: close square bracket (]) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1312,
    text: '1312 - Possible XSS attack: tilde character (~) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1314,
    text: '1314 - Possible XSS attack: back quote ( `) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1315,
    text: '1315 - Possible XSS attack: double encoding (%[2|3]) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1400,
    text: '1400 - Possible trick to evade protection: UTF7/8 encoding (&amp;#) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1401,
    text: '1401 - Possible trick to evade protection: MS encoding (%U) found in Body, Path, Query String or Cookies'
  },
  {
    value: 1402,
    text: '1402 - Possible trick to evade protection: encoded chars (%20-%3F) found in Body, Query String or Cookies'
  },
  {
    value: 1500,
    text: '1500 - Possible File Upload attempt: asp/php (.ph, .asp or .ht) found in filename in a multipart POST containing a file'
  },
  {
    value: 2001,
    text: '2001 - Possible CVE-2022-22965 attack: Tomcat Pipeline Convalue: 0 ,text tampering'
  }
]

/* eslint-enable no-useless-escape */
export const itemDefaultCondition = {
  title: 'Any HTTP Header Value',
  match: 'any_http_header_value'
}
