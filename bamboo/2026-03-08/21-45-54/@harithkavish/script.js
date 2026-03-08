document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
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

    // FAQ toggle functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            const answer = this.querySelector('p');
            if (answer) {
                answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Add hover effects for cards
    const cards = document.querySelectorAll('.feature-card, .use-card, .sustainability-card, .cultivation-step');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform var(--transition-speed) ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Animation on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .use-card, .sustainability-card, .cultivation-step, .faq-item');
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const screenTop = window.innerHeight / 3;
            if (elementTop < screenTop) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Initialize animations
    document.addEventListener('DOMContentLoaded', () => {
        elements = document.querySelectorAll('.feature-card, .use-card, .sustainability-card, .cultivation-step, .faq-item');
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity var(--transition-speed) ease, transform var(--transition-speed) ease';
        });
    });

    // Call the animation function on scroll
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
});