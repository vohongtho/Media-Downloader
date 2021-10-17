const axios = require("axios").default;
const HttpsProxyAgent = require("https-proxy-agent");
const agent = new HttpsProxyAgent(
  "http://lunguyen062019:73693da4133179c3a@103.90.231.252:9055"
);
const helpers_1 = require("./signature");
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
let collector = [];
let sessionList = [];
let headers = {
  referer: "https://www.tiktok.com/",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4102.161 Safari/537.36",
};
let csrf = [];
let noWaterMark = false;
let input = "";
const request_promise_1 = __importDefault(require("request-promise"));
cookieJar = request_promise_1.default.jar();
const timeout = 0;
async function getVideoMeta(input, html = true) {
  console.log("getVideoMeta");
  await getValidHeaders(input, false);
  console.log("getValidHeaders");

  if (!input) {
    throw `Url is missing`;
  }
  let videoData = {};
  console.log("input", input);
  console.log("html", html);

  if (html) {
    console.log("getVideoMetadataFromHtml");
    await getVideoMetadataFromHtml(input).then((data) => {
      videoData = data;
    });
  } else {
    console.log("getVideoMetadata");
    await getVideoMetadata(input).then((data) => {
      videoData = data;
    });
  }

  console.log("videoData", videoData);

  const videoItem = {
    id: videoData.id,
    secretID: videoData.video.id,
    text: videoData.desc,
    createTime: videoData.createTime,
    authorMeta: {
      id: videoData.author.id,
      secUid: videoData.author.secUid,
      name: videoData.author.uniqueId,
      nickName: videoData.author.nickname,
      following: videoData.authorStats.followingCount,
      fans: videoData.authorStats.followerCount,
      heart: videoData.authorStats.heartCount,
      video: videoData.authorStats.videoCount,
      digg: videoData.authorStats.diggCount,
      verified: videoData.author.verified,
      private: videoData.author.secret,
      signature: videoData.author.signature,
      avatar: videoData.author.avatarLarger,
    },
    musicMeta: {
      musicId: videoData.music.id,
      musicName: videoData.music.title,
      musicAuthor: videoData.music.authorName,
      musicOriginal: videoData.music.original,
      coverThumb: videoData.music.coverThumb,
      coverMedium: videoData.music.coverMedium,
      coverLarge: videoData.music.coverLarge,
      duration: videoData.music.duration,
    },
    imageUrl: videoData.video.cover,
    videoUrl: videoData.video.playAddr,
    videoUrlNoWaterMark: "",
    videoApiUrlNoWaterMark: "",
    videoMeta: {
      width: videoData.video.width,
      height: videoData.video.height,
      ratio: videoData.video.ratio,
      duration: videoData.video.duration,
      duetEnabled: videoData.duetEnabled,
      stitchEnabled: videoData.stitchEnabled,
      duetInfo: videoData.duetInfo,
    },
    covers: {
      default: videoData.video.cover,
      origin: videoData.video.originCover,
    },
    diggCount: videoData.stats.diggCount,
    shareCount: videoData.stats.shareCount,
    playCount: videoData.stats.playCount,
    commentCount: videoData.stats.commentCount,
    downloaded: false,
    mentions: videoData.desc.match(/(@\w+)/g) || [],
    hashtags: videoData.challenges
      ? videoData.challenges.map(({ id, title, desc, profileLarger }) => ({
          id,
          name: title,
          title: desc,
          cover: profileLarger,
        }))
      : [],
    effectStickers: videoData.effectStickers
      ? videoData.effectStickers.map(({ ID, name }) => ({
          id: ID,
          name,
        }))
      : [],
  };
  try {
    if (noWaterMark) {
      videoItem.videoApiUrlNoWaterMark = await extractVideoId(videoItem);
      videoItem.videoUrlNoWaterMark = await getUrlWithoutTheWatermark(
        videoItem.videoApiUrlNoWaterMark
      );
    }
  } catch (_a) {}
  collector.push(videoItem);
  return videoItem;
}

async function getValidHeaders(url = "", signUrl = true) {
  const options = Object.assign(
    Object.assign(
      { uri: url, method: "HEAD" },
      signUrl
        ? {
            qs: {
              _signature: helpers_1.sign(url),
            },
          }
        : {}
    ),
    {
      headers: {
        "x-secsdk-csrf-request": 1,
        "x-secsdk-csrf-version": "1.2.5",
      },
      httpsAgent: agent,
    }
  );
  try {
    await request(options);
  } catch (error) {
    throw error.message;
  }
}

function getProxy() {
  const proxy =
    Array.isArray(this.proxy) && this.proxy.length
      ? this.proxy[Math.floor(Math.random() * this.proxy.length)]
      : this.proxy;
  if (proxy) {
    if (proxy.indexOf("socks4://") > -1 || proxy.indexOf("socks5://") > -1) {
      return {
        socks: true,
        proxy: new socks_proxy_agent_1.SocksProxyAgent(proxy),
      };
    }
    return {
      socks: false,
      proxy,
    };
  }
  return {
    socks: false,
    proxy: "",
  };
}

async function request(
  {
    uri,
    method,
    qs,
    body,
    form,
    headers,
    json,
    gzip,
    followAllRedirects,
    simple = true,
  },
  bodyOnly = true
) {
  return new Promise(async (resolve, reject) => {
    const proxy = getProxy();
    const options = Object.assign(
      Object.assign(
        Object.assign(
          Object.assign(
            Object.assign(
              Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign(
                      Object.assign(
                        Object.assign(
                          { jar: cookieJar, uri, method },
                          qs ? { qs } : {}
                        ),
                        body ? { body } : {}
                      ),
                      form ? { form } : {}
                    ),
                    {
                      headers: Object.assign(
                        Object.assign(Object.assign({}, headers), headers),
                        this.csrf ? { "x-secsdk-csrf-token": this.csrf } : {}
                      ),
                    }
                  ),
                  json ? { json: true } : {}
                ),
                gzip ? { gzip: true } : {}
              ),
              {
                resolveWithFullResponse: true,
                followAllRedirects: followAllRedirects || false,
                simple,
              }
            ),
            proxy.proxy && proxy.socks ? { agent: proxy.proxy } : {}
          ),
          proxy.proxy && !proxy.socks ? { proxy: `http://${proxy.proxy}/` } : {}
        ),
        this.strictSSL === false ? { rejectUnauthorized: false } : {}
      ),
      { timeout: 10000 }
    );
    const session = sessionList[Math.floor(Math.random() * sessionList.length)];
    if (session) {
      cookieJar.setCookie(session, "https://tiktok.com");
    }
    const cookies = cookieJar.getCookieString("https://tiktok.com");
    if (cookies.indexOf("tt_webid_v2") === -1) {
      cookieJar.setCookie(
        `tt_webid_v2=69${helpers_1.makeid(
          17
        )}; Domain=tiktok.com; Path=/; Secure; hostOnly=false`,
        "https://tiktok.com"
      );
    }
    try {
      let response = [];
      // response = await axios.request(options).then((response) => {
      //   console.log(response);
      // });
      await axios(options.uri, options).then(function (res) {
        response = res;
      });

      if (options.method === "HEAD") {
        let _csrf = response.headers["x-ware-csrf-token"];
        csrf = _csrf.split(",")[1];
      }

      console.log("Request - response", response.data);
      setTimeout(() => {
        resolve(bodyOnly ? response.data : response);
      }, timeout);
    } catch (error) {
      reject(error);
    }
  });
}
async function getVideoMetadataFromHtml() {
  const options = {
    uri: this.input,
    method: "GET",
    json: true,
  };
  try {
    const response = await request(options);
    if (!response) {
      throw new Error(`Can't extract video meta data`);
    }
    const rawVideoMetadata = response
      .split(
        /<script id="__NEXT_DATA__" type="application\/json" nonce="[\w-]+" crossorigin="anonymous">/
      )[1]
      .split(`</script>`)[0];
    const videoProps = JSON.parse(rawVideoMetadata);
    const videoData = videoProps.props.pageProps.itemInfo.itemStruct;
    return videoData;
  } catch (error) {
    throw `Can't extract video metadata: ${this.input}`;
  }
}

async function getVideoMetadata(url = "") {
  console.log("URL:" + url);
  const videoData = /tiktok.com\/(@[\w.-]+)\/video\/(\d+)/.exec(
    url || this.input
  );

  if (videoData) {
    console.log("videoData", videoData);
    const videoUsername = videoData[1];
    const videoId = videoData[2];
    const options = {
      method: "GET",
      uri: `https://www.tiktok.com/node/share/video/${videoUsername}/${videoId}`,
      json: true,
      headers: headers,
      httpsAgent: agent,
    };
    try {
      console.log("options", options);
      const response = await request(options);
      if (response.statusCode === 0) {
        return response.itemInfo.itemStruct;
      }
      console.log("response", response);
      return response;
    } catch (err) {
      if (err.statusCode === 404) {
        throw new Error("Video does not exist");
      }
    }
  }
  throw new Error(`Can't extract video metadata: ${input}`);
}

async function extractVideoId(item) {
  if (item.createTime > 1595808000) {
    return "";
  }
  try {
    const options = {
      method: "GET",
      uri: `https://www.tiktok.com/node/share/video/${videoUsername}/${videoId}`,
      json: true,
      headers: headers,
    };
    const result = await request(options);
    const position = Buffer.from(result).indexOf("vid:");
    if (position !== -1) {
      const id = Buffer.from(result)
        .slice(position + 4, position + 36)
        .toString();
      return `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${id}&vr_type=0&is_play_url=1&source=PackSourceEnum_PUBLISH&media_type=4${
        this.hdVideo ? `&ratio=default&improve_bitrate=1` : ""
      }`;
    }
  } catch (_a) {}
  return "";
}

exports.getVideoMeta = getVideoMeta;
exports.getValidHeaders = getValidHeaders;
exports.request = request;
exports.getVideoMetadata = getVideoMetadata;
exports.getVideoMetadataFromHtml = getVideoMetadataFromHtml;
exports.extractVideoId = extractVideoId;
