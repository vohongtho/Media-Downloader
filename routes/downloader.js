const request = require("request");
const axios = require('axios');

const router = require("express").Router();
const youtubeDl = require("youtube-dl");
const tiktokScraper = require("tiktok-scraper");

function toSupportedFormat(url) {
  if (url.includes("list=")) {
    const playlistId = url.substring(url.indexOf("list=") + 5);

    return `https://www.youtube.com/playlist?list=${playlistId}`;
  }

  return url;
}

router.post("/instagram", (req, res) => {
  const url_post = req.body.url;
  const split_url = url_post.split("/");
  const ig_code = split_url[4];

  const url = `https://www.instagram.com/p/${ig_code}/?__a=1`;

  request(url, { json: true ,url},(err, response, body) => {
    if (err) {
      res.json({ status: "error", details: "Error on getting response" });

      res.end();
    } else {
		console.log(response);
      let json = JSON.parse(response.body);

      if (json.hasOwnProperty("graphql")) {
        const { shortcode_media } = json.graphql;

        const { __typename: postType } = shortcode_media;

        if (
          postType != "GraphImage" &&
          postType != "GraphSidecar" &&
          postType != "GraphVideo"
        ) {
          res.json({ status: "error", details: "No Post Type Found" });
        } else {
          const { display_url: displayUrl, edge_media_to_caption } =
            shortcode_media;

          const { edges: captionCheck } = edge_media_to_caption;

          const caption =
            captionCheck.length == 1 ? captionCheck[0].node.text : "";

          const {
            username: owner,
            is_verified,
            profile_pic_url: profile_pic,
            full_name,
            is_private,
            edge_owner_to_timeline_media,
          } = shortcode_media.owner;

          const total_media = edge_owner_to_timeline_media.count;
          const hashtags = caption.match(/#\w+/g);

          //GraphImage = single image post
          if (postType === "GraphImage") {
            const dataDownload = displayUrl;

            res.json({
              status: "success",
              postType: "SingleImage",
              displayUrl,
              caption,
              owner,
              is_verified,
              profile_pic,
              full_name,
              is_private,
              total_media,
              hashtags,
              dataDownload,
            });

            res.end();
            //GraphSidecar = multiple post
          } else if (postType === "GraphSidecar") {
            const dataDownload = [];

            for (const post of shortcode_media.edge_sidecar_to_children.edges) {
              const { is_video, display_url, video_url } = post.node;

              const placeholder_url = !is_video ? display_url : video_url;

              dataDownload.push({
                is_video,
                placeholder_url,
              });
            }

            res.json({
              status: "success",
              postType: "MultiplePost",
              displayUrl,
              caption,
              owner,
              is_verified,
              profile_pic,
              full_name,
              is_private,
              total_media,
              hashtags,
              dataDownload,
            });

            res.end();
            //GraphVideo = video post
          } else if (postType === "GraphVideo") {
            const dataDownload = shortcode_media.owner.videoUrl;

            res.json({
              status: "success",
              postType: "SingleVideo",
              displayUrl,
              caption,
              owner,
              is_verified,
              profile_pic,
              full_name,
              is_private,
              total_media,
              hashtags,
              dataDownload,
            });

            res.end();
          }
        }
      } else {
        res.json({ status: "error", details: "URL Failed" });

        res.end();
      }
    }
  });
});

router.post("/youtube", (req, res) => {
  const { url } = req.body;

  youtubeDl.getInfo(url, function (err, info) {
    if (err) {
      res.json({ status: "error", details: err });

      res.end();
    } else {
      if (info.hasOwnProperty("uploader_url")) {
        const {
          uploader_url: ownerUrl,
          uploader_id: ownerId,
          channel_url: channelUrl,
          uploader,
          view_count: totalViews,
          id: urlId,
          thumbnail,
          description,
          _filename: filename,
          duration,
          fulltitle: title,
          categories,
          formats,
        } = info;

        const dataFormats = [];

        for (const currentFormat of formats) {
          const {
            formatId,
            url: dataDownload,
            format,
            ext,
            formatText,
            filesize,
            acodec,
          } = currentFormat;

          if (acodec === "none") {
            continue;
          }

          dataFormats.push({
            dataDownload,
            format,
            ext,
            filesize,
          });
        }

        res.json({
          status: "success",
          ownerUrl,
          ownerId,
          channelUrl,
          uploader,
          totalViews,
          urlId,
          thumbnail,
          description,
          filename,
          duration,
          title,
          categories,
          dataFormats,
        });

        res.end();
      } else {
        res.json({
          status: "error",
          details: "Failed, Please check the URL!",
        });

        res.end();
      }
    }
  });
});

router.post("/youtube-playlist", (req, res) => {
  const url = toSupportedFormat(req.body.url);

  youtubeDl.getInfo(url, function (err, info) {
    if (err) {
      res.json({ status: "error", details: err });

      res.end();
    } else {
      let dataDownloads = [];

      for (const playlist of info) {
        const {
          uploader_url: ownerUrl,
          uploader_id: ownerId,
          channel_url: channelUrl,
          uploader,
          view_count: totalViews,
          id: urlId,
          thumbnail,
          description,
          _filename: filename,
          duration,
          fulltitle: title,
          categories,
          formats,
        } = playlist;

        const dataFormats = [];

        for (const currentFormat of formats) {
          const {
            format_id: formatId,
            url: dataDownload,
            format_note: format,
            ext,
            format: formatText,
            filesize,
            acodec,
          } = currentFormat;

          if (acodec === "none") {
            continue;
          }

          dataFormats.push({
            dataDownload,
            format,
            ext,
            filesize,
          });
        }

        dataDownloads.push({
          ownerUrl,
          ownerId,
          channelUrl,
          uploader,
          totalViews,
          urlId,
          thumbnail,
          description,
          filename,
          duration,
          title,
          categories,
          dataFormats,
        });
      }

      res.json({ status: "success", dataDownloads: dataDownloads });

      res.end();
    }
  });
});

router.post("/tiktok", async (req, res) => {
  const url = req.body.url;
  let resss = new Promise((resolve, reject) => {
    tiktokScraper
      .getVideoMeta(url)
      .then((response) => {
        // Store the headers for downloading the video
        const { headers, collector } = response;

        const {
          authorMeta,
          text: description,
          imageUrl: thumbnail,
          videoUrl: urlDownload,
          videoMeta,
        } = collector[0];
        const {
          name: username,
          nickName: name,
          avatar: profilePic,
        } = authorMeta;

        const { ratio: format } = videoMeta;

        let returnInfo = {
          status: "success",
          headers,
          username,
          name,
          profilePic,
          description,
          thumbnail,
          format,
          urlDownload,
        };
        // Resolve the promise with the information
        resolve(returnInfo);

        //   // Store data about the video
        //   returnInfo = response.collector[0];
        //   returnInfo.videoPath = path.join(basePath, `${videoID}.mp4`);

        //   // Shorten the numbers
        //   returnInfo.playCount = shortNum(returnInfo.playCount);
        //   returnInfo.diggCount = shortNum(returnInfo.diggCount);
        //   returnInfo.shareCount = shortNum(returnInfo.shareCount);
        //   returnInfo.commentCount = shortNum(returnInfo.commentCount);

        // log.info('📲 - Downloading...', { serverID: guildID })
      })
      .catch((err) => {
        // Reject with the
        reject(err);
      });
  })
    .then((value) => {
      res.json(value);
      res.end();
    })
    .catch((err) => {
      res.json({
        status: "error",
        details: "Failed, Please check the URL!",
        err
      });
      res.end();
    });
});

router.post("/facebook", async (req, res) => {
  const { url } = req.body;

  youtubeDl.getInfo(url, (err, info) => {
    if (err) {
      res.json({ status: "error", details: err });

      res.end();
    } else {
      const { _filename: filename, thumbnails, fulltitle: title } = info;

      const thumbnail = thumbnails[0].url;

      const dataDownloads = [];

      for (const currentFormat of info.formats) {
        const {
          format_note: formatNote,
          ext: extension,
          url: urlDownload,
        } = currentFormat;

        dataDownloads.push({
          formatNote,
          extension,
          urlDownload,
        });
      }

      res.json({
        status: "success",
        title,
        thumbnail,
        filename,
        dataDownloads,
      });

      res.end();
    }
  });
});

router.post("/dailymotion", (req, res) => {
  const { url } = req.body;

  youtubeDl.getInfo(url, (err, info) => {
    if (err) {
      res.json({
        status: "error",
        details: err,
      });

      res.end();
    } else {
      if (info.hasOwnProperty("_filename")) {
        const {
          _filename: filename,
          ext: extension,
          height: format,
          description,
          uploader,
          fulltitle: title,
          url: urlDownload,
          thumbnail,
        } = info;

        res.json({
          status: "success",
          filename,
          extension,
          format,
          description,
          uploader,
          title,
          thumbnail,
          urlDownload,
        });

        res.end();
      } else {
        res.json({
          status: "error",
          details: "Failed, Please check the URL!",
        });

        res.end();
      }
    }
  });
});


module.exports = router;
