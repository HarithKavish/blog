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

                // Update active nav link
                document.querySelectorAll('.main-nav a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });

    // Add hover effects to sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform var(--transition-speed) ease';
        });

        section.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add animation to facts section
    const facts = document.querySelectorAll('.fact');
    let factIndex = 0;
    const factInterval = setInterval(() => {
        if (factIndex < facts.length) {
            facts[factIndex].style.opacity = '1';
            factIndex++;
        } else {
            clearInterval(factInterval);
        }
    }, 3000);

    // Initialize opacity for facts
    facts.forEach(fact => {
        fact.style.opacity = '0';
        fact.style.transition = 'opacity var(--transition-speed) ease';
    });

    // Add animation to habitat types
    const habitatTypes = document.querySelectorAll('.habitat-type');
    habitatTypes.forEach((type, index) => {
        type.style.opacity = '0';
        type.style.transform = 'translateY(20px)';
        type.style.transition = `opacity ${index * 0.3}s ease, transform ${index * 0.3}s ease`;
    });

    // Add animation to castes
    const castes = document.querySelectorAll('.caste');
    castes.forEach((caste, index) => {
        caste.style.opacity = '0';
        caste.style.transform = 'translateY(20px)';
        caste.style.transition = `opacity ${index * 0.3}s ease, transform ${index * 0.3}s ease`;
    });

    // Add animation to methods
    const methods = document.querySelectorAll('.method');
    methods.forEach((method, index) => {
        method.style.opacity = '0';
        method.style.transform = 'translateY(20px)';
        method.style.transition = `opacity ${index * 0.3}s ease, transform ${index * 0.3}s ease`;
    });

    // Add animation to details
    const details = document.querySelectorAll('.detail');
    details.forEach((detail, index) => {
        detail.style.opacity = '0';
        detail.style.transform = 'translateY(20px)';
        detail.style.transition = `opacity ${index * 0.3}s ease, transform ${index * 0.3}s ease`;
    });

    // Add animation to actions
    const actions = document.querySelectorAll('.action');
    actions.forEach((action, index) => {
        action.style.opacity = '0';
        action.style.transform = 'translateY(20px)';
        action.style.transition = `opacity ${index * 0.3}s ease, transform ${index * 0.3}s ease`;
    });

    // Add animation to social links
    const socialLinks = document.querySelectorAll('.social-icon');
    socialLinks.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(10px)';
        link.style.transition = `opacity ${index * 0.2}s ease, transform ${index * 0.2}s ease`;
    });
});