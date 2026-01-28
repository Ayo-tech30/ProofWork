// Main JavaScript for landing page

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// Animate stats on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statElement = entry.target;
            const targetValue = parseInt(statElement.textContent.replace(/[^0-9]/g, ''));
            if (targetValue && !statElement.classList.contains('animated')) {
                statElement.classList.add('animated');
                animateValue(statElement, 0, targetValue, 2000);
            }
        }
    });
}, observerOptions);

// Observe hero stats
document.querySelectorAll('.hero-stats h3').forEach(stat => {
    statsObserver.observe(stat);
});

// Add hover effects to cards
document.querySelectorAll('.feature-card, .pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Lazy load background image
const hero = document.querySelector('.hero');
if (hero) {
    // Create a placeholder gradient if no image is available
    if (!hero.style.backgroundImage || hero.style.backgroundImage === 'url("images/bg.jpg")') {
        hero.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Add loading states to buttons
document.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
        // Only add loading state if it's a form submit or action button
        if (this.type === 'submit' || this.classList.contains('action-btn')) {
            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            // Reset after 3 seconds (form handlers should override this)
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = originalText;
            }, 3000);
        }
    });
});

// Console easter egg
console.log(`
%c██████╗ ██████╗  ██████╗  ██████╗ ███████╗██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗
%c██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔════╝██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝
%c██████╔╝██████╔╝██║   ██║██║   ██║█████╗  ██║ █╗ ██║██║   ██║██████╔╝█████╔╝ 
%c██╔═══╝ ██╔══██╗██║   ██║██║   ██║██╔══╝  ██║███╗██║██║   ██║██╔══██╗██╔═██╗ 
%c██║     ██║  ██║╚██████╔╝╚██████╔╝██║     ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗
%c╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝      ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝

Build your reputation. Verify your skills. 🚀
`, 
'color: #6366f1', 
'color: #8b5cf6', 
'color: #6366f1', 
'color: #8b5cf6', 
'color: #6366f1',
'color: #8b5cf6'
);

console.log('%cInterested in how this works? Check out our GitHub repo!', 'color: #10b981; font-size: 14px; font-weight: bold;');
