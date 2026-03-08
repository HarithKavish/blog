document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add hover effects to principle cards
    const principleCards = document.querySelectorAll('.principle-card');
    principleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
        });
    });

    // Add fade-in animation to cards on scroll
    const cards = document.querySelectorAll('.card-enter');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('card-enter');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        observer.observe(card);
    });

    // Add smooth scroll for main navigation
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});