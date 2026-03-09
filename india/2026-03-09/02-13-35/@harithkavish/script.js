document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
        });
        }
    });
});

    // Button hover effects and animations
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Highlight facts on hover
    document.querySelectorAll('.fact').forEach(fact => {
        fact.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f0f0';
        });

        fact.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
    });

    // Add animation to sections on scroll
    const sections = document.querySelectorAll('section');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, options);

    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Explore button functionality
    document.querySelector('.btn.explore').addEventListener('click', function(e) {
        e.preventDefault();
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        });

        // Show all sections except the facts section
        const factsSection = document.querySelector('.facts');
        factsSection.style.display = 'none';
    });

    // Facts button functionality
    document.querySelector('.btn.facts').addEventListener('click', function(e) {
        e.preventDefault();
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        });

        // Show only facts section
        const factsSection = document.querySelector('.facts');
        factsSection.style.display = 'block';
    });
});