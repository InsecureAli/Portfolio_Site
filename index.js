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

// Dynamic Add Project logic
const addProjectBtn = document.getElementById("add-project");
if (addProjectBtn) {
    addProjectBtn.addEventListener("click", () => {
        const container = document.querySelector(".projects");
        const newCard = document.createElement("article");
        
        newCard.className = "project";
        newCard.tabIndex = 0;
        newCard.innerHTML = `
            <div class="project-media"><div class="thumb"></div></div>
            <div class="project-info">
                <h3>New Project</h3>
                <p>Added dynamically from the + button.</p>
                <a class="project-link" href="#">View case study →</a>
            </div>
        `;

        container.appendChild(newCard);

        // Run reveal animation for the new card
        setTimeout(() => newCard.classList.add('inview'), 50);
    });
}

// Netlify Function Form Submit Handler (Replaces direct EmailJS)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        
        // Visual feedback
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, message })
            });

            const data = await response.json();

            if (response.status === 429) {
                alert(data.message); // Alerts the spammer they hit the limit
            } else if (response.ok) {
                alert("Message sent successfully!");
                contactForm.reset();
            } else {
                alert("Error sending message. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Oops! Something went wrong.");
        } finally {
            // Reset button
            submitBtn.textContent = 'Send message';
            submitBtn.disabled = false;
        }
    });
}