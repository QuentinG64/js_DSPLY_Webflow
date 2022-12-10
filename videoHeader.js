(async () => {
  const videoElement = document.querySelector("video");

  // Create a MediaSource instance and connect it to video element
  const mediaSource = new MediaSource();
  // This creates a URL that points to the media buffer,
  // and assigns it to the video element src
  videoElement.src = URL.createObjectURL(mediaSource);

  // Video that will be fetched and appended
  const remoteVidUrl = `https://sandbox.dsply.fr/assets/landing/videos/banners/BannerReelLanding_VP9.webm`;
  const remoteVidUrlCompress = `https://sandbox.dsply.fr/assets/landing/videos/banners/BannerReelLanding_VP9_compress.webm`;
  const remoteVidMobile = `https://sandbox.dsply.fr/assets/landing/videos/banners/BannerReelLanding_H.265.mp4`;

  // Fetch remote URL, getting contents as binary blob
  const vidBlob = await (await fetch(remoteVidUrl)).blob();
  // We need array buffers to work with media source
  const vidBuff = await vidBlob.arrayBuffer();

  /**
   * Before we can actually add the video, we need to:
   *  - Create a SourceBuffer, attached to the MediaSource object
   *  - Wait for the SourceBuffer to "open"
   */
  /** @type {SourceBuffer} */
  const sourceBuffer = await new Promise((resolve, reject) => {
    const getSourceBuffer = () => {
      try {
        const sourceBuffer = mediaSource.addSourceBuffer(`video/webm; codecs="vp9"`);
        resolve(sourceBuffer);
      } catch (e) {
        reject(e);
      }
    };
    if (mediaSource.readyState === "open") {
      getSourceBuffer();
    } else {
      mediaSource.addEventListener("sourceopen", getSourceBuffer);
    }
  });

  // Now that we have an "open" source buffer, we can append to it
  sourceBuffer.appendBuffer(vidBuff);
  // Listen for when append has been accepted and
  // You could alternative use `.addEventListener` here instead
  sourceBuffer.onupdateend = () => {
    // Nothing else to load
    sourceBuffer.addEventListener("updateend", function () {
      if (!sourceBuffer.updating && mediaSource.readyState === "open") {
        mediaSource.endOfStream();
      }
    });
    // Start playback!
    // Note: this will fail if video is not muted, due to rules about
    // autoplay and non-muted videos
    videoElement.play();
  };

  // Debug Info
  console.log({
    sourceBuffer,
    mediaSource,
    videoElement,
  });
})();
