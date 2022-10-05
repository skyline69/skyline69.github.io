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
    window.location = "/contact";
});



