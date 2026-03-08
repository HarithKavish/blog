document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Update active navigation item
                const navLinks = document.querySelectorAll('.main-nav a');
                navLinks.forEach(link => {
                    link.style.color = 'var(--text-light)';
                });

                this.style.color = 'var(--primary-color)';
            }
        });
    });

    // Add animation classes to sections on scroll
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        section.classList.add('hidden');
        observer.observe(section);
    });

    // Change background color based on section
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const sections = document.querySelectorAll('section');

        sections.forEach((section, index) => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.getBoundingClientRect().top + window.scrollY;

            if (scrollPosition > (sectionTop - 200)) {
                document.body.style.backgroundColor = getSectionBackgroundColor(index);
            }
        });
    });

    function getSectionBackgroundColor(index) {
        const sections = document.querySelectorAll('section');
        const section = sections[index];

        if (section.classList.contains('space-race-section')) {
            return '#f0f8ff';
        } else if (section.classList.contains('space-stations-section')) {
            return '#e8f5e9';
        } else if (section.classList.contains('deep-space-section')) {
            return '#e3f2fd';
        } else if (section.classList.contains('future-section')) {
            return '#f3e5f5';
        } else {
            return '#f9f9f9';
        }
    }
});