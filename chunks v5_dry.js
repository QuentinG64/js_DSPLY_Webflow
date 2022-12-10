<script src="https://cdn.jsdelivr.net/npm/hls.js@canary"></script>;

var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if ("ontouchstart" in document.documentElement && isIOS) {
  var video = document.getElementById("video");
  var videoSrc = "https://sandbox.dsply.fr/assets/landing/videos/banners/frag/frag2/out.m3u8";

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = videoSrc;
  } else if (Hls.isSupported()) {
    var hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
  }
} else {
  const getDuration = (blob) => {
    return new Promise((res) => {
      const tempVidElem = document.createElement("video");
      tempVidElem.onloadedmetadata = () => {
        res(tempVidElem.duration);
        URL.revokeObjectURL(tempVidElem.src);
      };
      tempVidElem.src = URL.createObjectURL(blob);
    });
  };

  const addSourceBufferWhenOpen = (mediaSource, mimeStr, mode = "segments") => {
    return new Promise((res, rej) => {
      const getSourceBuffer = () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer(mimeStr);
          sourceBuffer.mode = mode;
          res(sourceBuffer);
        } catch (e) {
          rej(e);
        }
      };
      if (mediaSource.readyState === "open") {
        getSourceBuffer();
      } else {
        mediaSource.addEventListener("sourceopen", getSourceBuffer);
      }
    });
  };

  const b64toBlob = (base64Str, mimeTypeStr) =>
    fetch(`data:${mimeTypeStr};base64,${base64Str}`).then((res) => res.blob());
  let browserName;

  function fnBrowserDetectDsktp() {
    let userAgent = navigator.userAgent;

    if (userAgent.match(/chrome|chromium|crios/i)) {
      return (browserName = true);
    } else if (userAgent.match(/firefox|fxios/i)) {
      return (browserName = true);
    } else if (userAgent.match(/safari/i)) {
      return (browserName = false);
    }
  }
  fnBrowserDetectDsktp();
  (async () => {
    const videoElement = document.querySelector("video");
    const vidClips = browserName
      ? [
          "https://sandbox.dsply.fr/assets/landing/videos/banners/segment1_VP9.webm",
          "https://sandbox.dsply.fr/assets/landing/videos/banners/segment2_VP9.webm",
        ]
      : [
          "https://sandbox.dsply.fr/assets/landing/videos/banners/segment1_H.265_dashinit.mp4",
          "https://sandbox.dsply.fr/assets/landing/videos/banners/segment2_H.265_dashinit.mp4",
        ];

    /**
     * @typedef {{url: string, duration: number, buff: ArrayBuffer}} ClipToAppend
     */
    /** @type {ClipToAppend[]} */
    const clipsToAppend = await Promise.all(
      vidClips.map(async (vidUrl) => {
        const blob = await (await fetch(vidUrl)).blob();
        const duration = await getDuration(blob);
        const buff = await blob.arrayBuffer();
        return {
          url: vidUrl,
          duration,
          buff,
        };
      })
    );

    // Normal setup, with MediaSource, Object URL, and prepped SourceBuffer
    const mediaSource = new MediaSource();
    videoElement.src = URL.createObjectURL(mediaSource);
    // mode = segments
    const sourceBuffer = await addSourceBufferWhenOpen(
      mediaSource,
      browserName ? `video/webm; codecs="vp9"` : `video/mp4; codecs="hev1"`,
      "segments"
    );

    /**
     * Pointer to last vid appended out of source list
     */
    let clipIndex = 0;
    sourceBuffer.onupdateend = () => {
      if (clipIndex < clipsToAppend.length - 1) {
        // We have another segment to add
        // BUT, first we need to offset the time by the duration of
        // the previously appended clip. Otherwise it will overwrite it
        sourceBuffer.timestampOffset += clipsToAppend[clipIndex].duration;
        // Now we can move on to next clip and append it
        clipIndex++;
        sourceBuffer.appendBuffer(clipsToAppend[clipIndex].buff);
      } else {
        // Done!
        mediaSource.endOfStream();
        videoElement.play();
      }
    };

    // This will kick off event listener chain above
    sourceBuffer.appendBuffer(clipsToAppend[clipIndex].buff);

    // Debug Info
    console.log({
      sourceBuffer,
      mediaSource,
      videoElement,
    });
  })();
}
