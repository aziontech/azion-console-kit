/* eslint id-length: "off" */

export const getFileIcon = (data) => {
  if (!data) return 'mdi mdi-file-document text-gray-500'

  if (data.isParentNav) {
    return 'mdi mdi-folder-open text-grey-500'
  }
  if (data.isFolder) {
    return 'mdi mdi-folder text-grey-500'
  }

  const fileName = data.name || data
  if (!fileName || typeof fileName !== 'string') {
    return 'mdi mdi-file-document text-gray-500'
  }

  const trimmedFileName = fileName.trim()
  if (!trimmedFileName) return 'mdi mdi-file-document text-gray-500'

  const parts = trimmedFileName.toLowerCase().split('.')
  const extension = parts.length > 1 ? parts[parts.length - 1] : ''
  const iconMap = {
    // Images
    jpg: 'mdi mdi-image text-green-500',
    jpeg: 'mdi mdi-image text-green-500',
    png: 'mdi mdi-image text-green-500',
    gif: 'mdi mdi-image text-green-500',
    bmp: 'mdi mdi-image text-green-500',
    svg: 'mdi mdi-vector-square text-green-500',
    webp: 'mdi mdi-image text-green-500',
    ico: 'mdi mdi-image text-green-500',
    tiff: 'mdi mdi-image text-green-500',

    // Documents
    pdf: 'mdi mdi-file-pdf-box text-red-500',
    doc: 'mdi mdi-file-word-box text-blue-600',
    docx: 'mdi mdi-file-word-box text-blue-600',
    txt: 'mdi mdi-file-document-outline text-gray-600',
    rtf: 'mdi mdi-file-document-outline text-gray-600',

    // Spreadsheets
    xls: 'mdi mdi-file-excel-box text-green-600',
    xlsx: 'mdi mdi-file-excel-box text-green-600',
    csv: 'mdi mdi-file-delimited-outline text-green-600',

    // Presentations
    ppt: 'mdi mdi-file-powerpoint-box text-orange-500',
    pptx: 'mdi mdi-file-powerpoint-box text-orange-500',

    // Web Technologies
    js: 'mdi mdi-language-javascript text-yellow-500',
    mjs: 'mdi mdi-language-javascript text-yellow-500',
    ts: 'mdi mdi-language-typescript text-blue-500',
    jsx: 'mdi mdi-react text-cyan-500',
    tsx: 'mdi mdi-react text-cyan-500',
    vue: 'mdi mdi-vuejs text-green-500',
    svelte: 'mdi mdi-file-code text-orange-500',
    html: 'mdi mdi-language-html5 text-orange-500',
    htm: 'mdi mdi-language-html5 text-orange-500',
    css: 'mdi mdi-language-css3 text-blue-500',
    scss: 'mdi mdi-sass text-pink-500',
    sass: 'mdi mdi-sass text-pink-500',
    less: 'mdi mdi-language-css3 text-blue-400',
    stylus: 'mdi mdi-language-css3 text-green-400',

    // Backend Languages
    php: 'mdi mdi-language-php text-purple-500',
    py: 'mdi mdi-language-python text-blue-500',
    pyw: 'mdi mdi-language-python text-blue-500',
    pyx: 'mdi mdi-language-python text-blue-500',
    java: 'mdi mdi-language-java text-red-500',
    class: 'mdi mdi-language-java text-red-500',
    jar: 'mdi mdi-language-java text-red-500',
    cpp: 'mdi mdi-language-cpp text-blue-600',
    cxx: 'mdi mdi-language-cpp text-blue-600',
    cc: 'mdi mdi-language-cpp text-blue-600',
    c: 'mdi mdi-language-c text-blue-600',
    h: 'mdi mdi-language-c text-blue-600',
    hpp: 'mdi mdi-language-cpp text-blue-600',
    cs: 'mdi mdi-language-csharp text-purple-600',
    go: 'mdi mdi-language-go text-cyan-600',
    rb: 'mdi mdi-language-ruby text-red-600',
    erb: 'mdi mdi-language-ruby text-red-600',
    swift: 'mdi mdi-language-swift text-orange-600',
    kt: 'mdi mdi-language-kotlin text-purple-500',
    kts: 'mdi mdi-language-kotlin text-purple-500',
    rs: 'mdi mdi-language-rust text-orange-500',

    // Scripting & Shell
    sh: 'mdi mdi-powershell text-blue-500',
    bash: 'mdi mdi-powershell text-blue-500',
    zsh: 'mdi mdi-powershell text-blue-500',
    fish: 'mdi mdi-powershell text-blue-500',
    ps1: 'mdi mdi-powershell text-blue-500',
    bat: 'mdi mdi-powershell text-blue-500',
    cmd: 'mdi mdi-powershell text-blue-500',

    // Database & Query Languages
    sql: 'mdi mdi-database-search text-blue-500',
    mysql: 'mdi mdi-database-search text-orange-500',
    pgsql: 'mdi mdi-database-search text-blue-600',
    sqlite: 'mdi mdi-database-search text-green-500',

    // Functional & Other Languages
    hs: 'mdi mdi-language-haskell text-purple-500',
    lhs: 'mdi mdi-language-haskell text-purple-500',
    ml: 'mdi mdi-file-code text-orange-500', // OCaml
    mli: 'mdi mdi-file-code text-orange-500', // OCaml interface
    fs: 'mdi mdi-language-fsharp text-blue-500',
    fsx: 'mdi mdi-language-fsharp text-blue-500',
    scala: 'mdi mdi-file-code text-red-500',
    sc: 'mdi mdi-file-code text-red-500',
    clj: 'mdi mdi-file-code text-green-600', // Clojure
    cljs: 'mdi mdi-file-code text-green-600', // ClojureScript
    erl: 'mdi mdi-file-code text-red-500', // Erlang
    hrl: 'mdi mdi-file-code text-red-500', // Erlang header
    ex: 'mdi mdi-file-code text-purple-500', // Elixir
    exs: 'mdi mdi-file-code text-purple-500', // Elixir script
    elm: 'mdi mdi-file-code text-blue-500',

    // Mobile Development
    m: 'mdi mdi-file-code text-blue-500', // Objective-C
    mm: 'mdi mdi-file-code text-blue-500', // Objective-C++

    // Scripting Languages
    lua: 'mdi mdi-language-lua text-blue-500',
    pl: 'mdi mdi-file-code text-blue-500', // Perl
    pm: 'mdi mdi-file-code text-blue-500', // Perl module
    r: 'mdi mdi-language-r text-blue-500',
    R: 'mdi mdi-language-r text-blue-500',
    rmd: 'mdi mdi-language-r text-blue-500',
    julia: 'mdi mdi-file-code text-purple-500',
    jl: 'mdi mdi-file-code text-purple-500',
    matlab: 'mdi mdi-file-code text-orange-500',

    // Assembly & Low-level
    asm: 'mdi mdi-file-code text-gray-600',
    s: 'mdi mdi-file-code text-gray-600',
    S: 'mdi mdi-file-code text-gray-600',

    // Markup & Templating
    md: 'mdi mdi-language-markdown text-orange-500',
    markdown: 'mdi mdi-language-markdown text-orange-500',
    tex: 'mdi mdi-file-document text-green-500', // LaTeX
    latex: 'mdi mdi-file-document text-green-500',

    // Config files
    json: 'mdi mdi-code-json text-yellow-600',
    json5: 'mdi mdi-code-json text-yellow-600',
    jsonc: 'mdi mdi-code-json text-yellow-600',
    xml: 'mdi mdi-xml text-orange-600',
    yml: 'mdi mdi-file-cog-outline text-red-600',
    yaml: 'mdi mdi-file-cog-outline text-red-600',
    toml: 'mdi mdi-file-cog-outline text-gray-600',
    ini: 'mdi mdi-file-cog-outline text-gray-600',
    cfg: 'mdi mdi-file-cog-outline text-gray-600',
    conf: 'mdi mdi-file-cog-outline text-gray-600',
    env: 'mdi mdi-file-cog-outline text-green-600',

    // Build & Package Files
    makefile: 'mdi mdi-file-cog text-orange-500',
    cmake: 'mdi mdi-file-cog text-blue-500',
    dockerfile: 'mdi mdi-docker text-blue-500',

    // Archives
    zip: 'mdi mdi-zip-box text-purple-500',
    rar: 'mdi mdi-archive text-purple-500',
    '7z': 'mdi mdi-archive text-purple-500',
    tar: 'mdi mdi-archive text-purple-500',
    gz: 'mdi mdi-archive text-purple-500',
    bz2: 'mdi mdi-archive text-purple-500',
    xz: 'mdi mdi-archive text-purple-500',

    // Media
    mp4: 'mdi mdi-video text-red-500',
    avi: 'mdi mdi-video text-red-500',
    mov: 'mdi mdi-video text-red-500',
    wmv: 'mdi mdi-video text-red-500',
    mkv: 'mdi mdi-video text-red-500',
    webm: 'mdi mdi-video text-red-500',
    mp3: 'mdi mdi-music text-green-500',
    wav: 'mdi mdi-music text-green-500',
    flac: 'mdi mdi-music text-green-500',
    ogg: 'mdi mdi-music text-green-500',
    aac: 'mdi mdi-music text-green-500',

    // Default folder icon for directories
    folder: 'mdi mdi-folder text-blue-500'
  }

  if (trimmedFileName.endsWith('/')) {
    return 'mdi mdi-folder text-blue-500'
  }

  if (!extension) {
    return 'mdi mdi-file text-gray-500'
  }

  return iconMap[extension] || 'mdi mdi-file text-gray-500'
}
