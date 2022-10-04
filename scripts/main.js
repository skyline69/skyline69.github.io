const vid = document.getElementById("bg-video");
const homebtn = document.getElementById("home-btn");
const projectsbtn = document.getElementById("projects-btn");
const aboutbtn = document.getElementById("about-btn");
const contactbtn = document.getElementById("contact-btn");

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

homebtn.addEventListener("click", () => {
    window.location = "/";
});

projectsbtn.addEventListener("click", () => {
    window.location = "/projects";
});

aboutbtn.addEventListener("click", () => {
    window.location = "/about";
});

contactbtn.addEventListener("click", () => {
    window.location = "/about";
});
