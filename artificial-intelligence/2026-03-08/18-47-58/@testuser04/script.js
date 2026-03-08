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
        });
    });

    // Add hover effects for cards
    const cards = document.querySelectorAll('.benefit-card, .application-card, .challenge-card, .future-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
    });

    // Add animation for introduction section
    const heroSection = document.querySelector('.hero-section');
    let heroHeight = heroSection.offsetHeight;
    let heroPosition = 0;

    window.addEventListener('scroll', function() {
        heroPosition = window.pageYOffset;
        if (heroPosition > heroHeight) {
            heroSection.style.opacity = '0.9';
            heroSection.style.transform = 'translateY(0)';
        }
    });

    // Add animation for stats
    const stats = document.querySelectorAll('.stat');
    stats.forEach(stat => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(10px)';
        stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        window.addEventListener('scroll', function() {
            if (window.scrollY > stat.offsetTop - 100) {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }
        });
    });
});