document.addEventListener("DOMContentLoaded", () => {
    // Select all elements with the 'fade-in' class
    const faders = document.querySelectorAll('.fade-in');

    // Set up the Intersection Observer options
    const appearOptions = {
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    // Create the Observer
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                // Add 'visible' class to trigger the CSS transition
                entry.target.classList.add('visible');
                // Stop observing the element once it has faded in
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    // Apply the Observer to each fader
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });
});