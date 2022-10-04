const vid = document.getElementById("bg-video");


if (document.readyState === "complete") {
    vid.play();
}

vid.addEventListener("timeupdate", function () {
    if(this.currentTime >= (this.duration-5)) {
        this.currentTime = 3.0;
    }
});