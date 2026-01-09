const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("toggle-btn");
const closeBtn = document.getElementById("close-btn");

openBtn.addEventListener("click", function() {
    sidebar.classList.add("active");
});

closeBtn.addEventListener("click", function() {
    sidebar.classList.remove("active");
});