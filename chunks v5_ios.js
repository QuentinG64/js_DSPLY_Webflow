<script src="https://cdn.jsdelivr.net/npm/hls.js@canary"></script>;
// <!-- Or if you want the latest version from the main branch -->
// <!-- <script src="https://cdn.jsdelivr.net/npm/hls.js@canary"></script> -->
var video = document.getElementById("video");
var videoSrc = "https://sandbox.dsply.fr/assets/landing/videos/banners/frag/frag2/out.m3u8";
//
// First check for native browser HLS support
//
if (video.canPlayType("application/vnd.apple.mpegurl")) {
  video.src = videoSrc;
  //
  // If no native HLS support, check if HLS.js is supported
  //
} else if (Hls.isSupported()) {
  var hls = new Hls();
  hls.loadSource(videoSrc);
  hls.attachMedia(video);
}
