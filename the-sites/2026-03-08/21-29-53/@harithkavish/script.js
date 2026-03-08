document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }

            // Update active navigation link
            document.querySelectorAll('.main-nav a').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }

    // Card hover animations
    const cards = document.querySelectorAll('.website-card, .blog-card, .feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add animation on scroll
    const animateOnScroll = () => {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const windowHeight = window.innerHeight;

            if (window.scrollY >= (sectionTop - windowHeight / 2)) {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }
        });
    };

    // Initialize animations
    document.addEventListener('DOMContentLoaded', animateOnScroll);

    // Add animation on scroll
    window.addEventListener('scroll', animateOnScroll);

    // Initialize with sections having opacity 0 and transform
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity var(--transition-speed) ease, transform var(--transition-speed) ease';
    });
});