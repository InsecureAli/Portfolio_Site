// ======================= index.js =======================

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Tilt effect for hero device card
const card = document.getElementById('tilt-card');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReduced && card) {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rx = (y * -10).toFixed(2);
    const ry = (x * 14).toFixed(2);
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
  });
}

// IntersectionObserver for fade-in animations
if (!prefersReduced) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('inview');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.project, .about-inner, .section-head').forEach(el => io.observe(el));
}


<script>
document.getElementById("add-project").addEventListener("click", () => {

    const container = document.querySelector(".projects");

    const card = document.createElement("article");
    card.className = "project";
    card.tabIndex = 0;

    card.innerHTML = `
        <div class="project-media"><div class="thumb"></div></div>
        <div class="project-info">
            <h3>New Project</h3>
            <p>Added dynamically from the + button.</p>
            <a class="project-link" href="#">View case study →</a>
        </div>
    `;

    container.appendChild(card);

    // Re-run reveal animation
    card.classList.add('inview');
});
</script>
