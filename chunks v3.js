/**
 * @file This shows how, when using the segments mode of SourceBuffer, and appending disparate files, you need to manage offsets yourself
 */
/**
 * Get the duration of video, via its raw blob
 * @param {Blob} blob
 * @returns {Promise<number>}
 */
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

/**
 * Adds (and returns once ready) a SourceBuffer to a MediaSource
 * @param {MediaSource} mediaSource
 * @param {string} mimeStr Example: `video/webm; codecs="vp9,opus"`
 * @param {'sequence' | 'segments'} [mode]
 * @returns {Promise<SourceBuffer>}
 */
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

/**
 * Convert a base64 string into a binary blob
 * @param {string} base64Str
 * @param {string} mimeTypeStr
 */
const b64toBlob = (base64Str, mimeTypeStr) =>
  fetch(`data:${mimeTypeStr};base64,${base64Str}`).then((res) => res.blob());
let browserName;

function fnBrowserDetect() {
  let userAgent = navigator.userAgent;

  if (userAgent.match(/chrome|chromium|crios/i)) {
    return (browserName = true);
  } else if (userAgent.match(/firefox|fxios/i)) {
    return (browserName = true);
  } else if (userAgent.match(/safari/i)) {
    return (browserName = false);
  }
}
fnBrowserDetect();
browserName
  ? (async () => {
      const videoElement = document.querySelector("video");
      const vidClips = [
        "https://sandbox.dsply.fr/assets/landing/videos/banners/segment1_VP9.webm",
        "https://sandbox.dsply.fr/assets/landing/videos/banners/segment2_VP9.webm",
      ];

      // For `sourceBuffer.mode = 'segments'`, we have to be careful with multiple
      // videos. Segments means that browser will try to sniff timestamps from
      // the files. In our case, we are using completely separate files, without
      // timeline info. So, we need to compute the duration of each, and then use
      // that later to manually offset each chunk from the previous

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
      const sourceBuffer = await addSourceBufferWhenOpen(mediaSource, `video/webm; codecs="vp9"`, "segments");

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
    })()
  : (async () => {
      const videoElement = document.querySelector("video");
      const vidClips = [
        "https://sandbox.dsply.fr/assets/landing/videos/banners/segment1_H.265_dashinit.mp4",
        "https://sandbox.dsply.fr/assets/landing/videos/banners/segment2_H.265_dashinit.mp4",
      ];

      // For `sourceBuffer.mode = 'segments'`, we have to be careful with multiple
      // videos. Segments means that browser will try to sniff timestamps from
      // the files. In our case, we are using completely separate files, without
      // timeline info. So, we need to compute the duration of each, and then use
      // that later to manually offset each chunk from the previous

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
      const sourceBuffer = await addSourceBufferWhenOpen(mediaSource, `video/mp4; codecs="hev1"`, "segments");

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
