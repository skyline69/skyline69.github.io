const homebtn = document.getElementById("home-btn");
const projectsbtn = document.getElementById("projects-btn");
const aboutbtn = document.getElementById("about-btn");
const contactbtn = document.getElementById("contact-btn");


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

const loader = document.querySelector(".loader-wrapper");
const programming_box = document.querySelector(".programming-lang");
const navbar = document.querySelector(".navbar");
const content = document.querySelector(".content");

window.onload = () => {
    document.title = "loading... | skyline69";
    setTimeout(function () {
        document.title = "skyline69";
        loader.style.opacity = "0";
        programming_box.style.display = "block";
        content.style.opacity = "100";
        navbar.style.opacity = "100";

    }, 1000)
    setTimeout(function() {loader.parentNode.removeChild(loader)},1200);

}
