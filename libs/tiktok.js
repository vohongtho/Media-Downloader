const scraper = require("./scraper");

const headers = {
  referer: "https://www.tiktok.com/",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4102.161 Safari/537.36",
};

function makeVerifyFp() {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const charlen = chars.length;
  const time = Buffer.from(new Date().getTime().toString()).toString("base64");
  const arr = "0".repeat(36).split("");
  arr[8] = "_";
  arr[13] = "_";
  arr[18] = "_";
  arr[23] = "_";
  arr[14] = "4";
  const str = arr
    .map((x) =>
      x === "0" ? chars.charAt(Math.floor(Math.random() * charlen)) : x
    )
    .join("");
  return `verify_${time.toLowerCase()}_${str}`;
}

function getInitOptions() {
  return {
    number: 30,
    since: 0,
    download: false,
    zip: false,
    asyncDownload: 5,
    asyncScraping: 3,
    proxy: "",
    filepath: "",
    filetype: "na",
    progress: false,
    event: false,
    by_user_id: false,
    noWaterMark: false,
    hdVideo: false,
    timeout: 0,
    tac: "",
    signature: "",
    verifyFp: this.makeVerifyFp(),
    headers: {
      "user-agent": constant_1.default.userAgent(),
      referer: "https://www.tiktok.com/",
    },
  };
}
async function getVideoMeta(input, options = {}) {
  if (options && typeof options !== "object") {
    throw new TypeError("Object is expected");
  }
  if (options === null || options === void 0 ? void 0 : options.proxyFile) {
    options.proxy = await proxyFromFile(
      options === null || options === void 0 ? void 0 : options.proxyFile
    );
  }
  if (options === null || options === void 0 ? void 0 : options.sessionFile) {
    options.sessionList = await sessionFromFile(
      options === null || options === void 0 ? void 0 : options.sessionFile
    );
  }
  // const contructor = Object.assign(
  //   Object.assign(Object.assign({}, getInitOptions()), options),
  //   { type: "video_meta", input }
  // );
  // const scraper = new core_1.TikTokScraper(contructor);
  const fullUrl = /^https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+/.test(
    input
  );
  scraper.headers = headers;
  const result = await scraper.getVideoMeta(input, !fullUrl);
  return {
    headers: Object.assign(Object.assign({}, headers), {
      cookie: cookieJar.getCookieString("https://tiktok.com"),
    }),
    collector: [result],
  };
}

async function getUrlWithoutTheWatermark(uri) {
  if (!uri) {
    return "";
  }
  const options = {
    uri,
    method: "GET",
    headers: {
      "user-agent":
        "com.zhiliaoapp.musically/2021600040 (Linux; U; Android 5.0; en_US; SM-N900T; Build/LRX21V; Cronet/TTNetVersion:6c7b701a 2020-04-23 QuicVersion:0144d358 2020-03-24)",
      "sec-fetch-mode": "navigate",
    },
    followAllRedirects: true,
    simple: false,
  };
  try {
    const response = await request(options, false);
    return response.request.uri.href;
  } catch (err) {
    throw new Error(`Can't extract video url without the watermark`);
  }
}

exports.getVideoMeta = getVideoMeta;
exports.getInitOptions = getInitOptions;
exports.makeVerifyFp = makeVerifyFp;
exports.getUrlWithoutTheWatermark = getUrlWithoutTheWatermark;
