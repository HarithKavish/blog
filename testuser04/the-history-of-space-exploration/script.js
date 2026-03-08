document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation active state
    const navLinks = document.querySelectorAll('.main-nav a');
    window.addEventListener('scroll', function() {
        let current = '';
        navLinks.forEach(link => {
            const linkSection = document.querySelector(link.getAttribute('href'));
            if (linkSection.scrollIntoView() === false) return;
            if (linkSection.offsetTop <= (window.pageYOffset + 100) && linkSection.offsetTop + linkSection.offsetHeight > (window.pageYOffset + 100)) {
                current = link.getAttribute('href');
            }
        });
        navLinks.forEach(link => link.classList.remove('active'));
        if (current) navLinks.forEach(link => {
            if (link.getAttribute('href') === current) link.classList.add('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });
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

    // Highlight current section in navigation
    window.addEventListener('load', function() {
        const firstSection = document.querySelector('#intro');
        if (firstSection) {
            const firstLink = document.querySelector('.main-nav a[href="#intro"]');
            if (firstLink) firstLink.classList.add('active');
        }
    });
});