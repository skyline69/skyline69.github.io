const vid = document.getElementById("bg-video");


vid.addEventListener("timeupdate", function () {
    if(this.currentTime >= (this.duration-5)) {
        this.currentTime = 3.0;
    }
});

window.addEventListener('load', async () => {

    try {
        await vid.play();
    } catch (err) {
        vid.controls = true;
    }
});