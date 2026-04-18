// ===== FORM INTERFACE LOGIC =====

let aiSuggestions = {};
let previewHTML = '';
let currentStep = 1;

// Check if we're on the form page or generated website
const isFormPage = document.getElementById('inputForm') !== null;

if (isFormPage) {
  // FORM PAGE LOGIC
  const inputForm = document.getElementById('inputForm');
  const suggestionsSection = document.getElementById('step2'); // Was 'suggestionsSection'
  const previewSection = document.getElementById('step3');     // Was 'previewSection'
  const editForm = document.getElementById('editForm');
  const loadingSpinner = document.getElementById('loadingState'); // Was 'loadingSpinner'
  const successMessage = document.getElementById('successStep');  // Was 'successMessage'
  const previewFrame = document.getElementById('previewFrame');

  // Update step indicator
  function updateStepIndicator(step) {
    currentStep = step;
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
      if (index + 1 === step) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }

  // Handle initial form submission
  inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const businessName = document.getElementById('businessName').value;
    const tagline = document.getElementById('tagline').value;
    const description = document.getElementById('description').value;

    // Validate inputs
    if (!businessName.trim() || !tagline.trim() || !description.trim()) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    // Show loading state with animation
    loadingSpinner.style.display = 'flex';
    editForm.style.display = 'none';
    suggestionsSection.style.display = 'block';
    inputForm.style.display = 'none';
    updateStepIndicator(2);

    try {
      // Call backend API to get AI suggestions
      const response = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ businessDescription: description })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      // Store AI suggestions
      aiSuggestions = data;

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Populate form fields with suggestions
      document.getElementById('about').value = data.suggestedAbout;
      document.getElementById('products').value = data.suggestedProducts.join(', ');
      document.getElementById('tone').value = data.suggestedTone;

      // Hide loading, show edit form with animation
      loadingSpinner.style.display = 'none';
      editForm.style.display = 'block';
      editForm.style.animation = 'slideUp 0.4s ease-out';

      // Show notification
      showNotification('AI suggestions loaded! ✨', 'success');

    } catch (error) {
      console.error('Error:', error);
      loadingSpinner.style.display = 'none';
      suggestionsSection.style.display = 'none';
      inputForm.style.display = 'block';
      showNotification('Failed to get suggestions: ' + error.message, 'error');
    }
  });

  // Show preview
  window.showPreview = async function() {
    const businessName = document.getElementById('businessName').value;
    const tagline = document.getElementById('tagline').value;
    const description = document.getElementById('description').value;
    const about = document.getElementById('about').value;
    const productsText = document.getElementById('products').value;
    const tone = document.getElementById('tone').value;
    const template = document.querySelector('input[name="template"]:checked').value;

    // Validate
    if (!about.trim() || !productsText.trim()) {
      showNotification('Please fill in all fields before previewing', 'error');
      return;
    }

    const products = productsText.split(',').map(p => p.trim());

    // Show loading
    showLoadingOverlay(true);
    updateStepIndicator(3);

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName,
          tagline,
          description,
          about,
          products: JSON.stringify(products),
          tone,
          template
        })
      });

      const data = await response.json();

      if (response.ok) {
        previewHTML = data.html;
        
        // Display preview in iframe
        previewFrame.srcdoc = previewHTML;
        
        // Hide loading after a slight delay
        await new Promise(resolve => setTimeout(resolve, 600));
        showLoadingOverlay(false);
        
        // Show preview section
        suggestionsSection.style.display = 'none';
        previewSection.style.display = 'block';
        previewSection.style.animation = 'slideUp 0.4s ease-out';
        
        showNotification('Preview ready! 👀', 'success');
      } else {
        showLoadingOverlay(false);
        showNotification('Failed to generate preview', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showLoadingOverlay(false);
      showNotification('Error generating preview: ' + error.message, 'error');
    }
  };

  // Back to edit from preview
  window.backToEdit = function() {
    previewSection.style.display = 'none';
    suggestionsSection.style.display = 'block';
    suggestionsSection.style.animation = 'slideUp 0.4s ease-out';
    updateStepIndicator(2);
  };

  // Download website
  window.downloadWebsite = async function() {
    const businessName = document.getElementById('businessName').value;
    const tagline = document.getElementById('tagline').value;
    const description = document.getElementById('description').value;
    const about = document.getElementById('about').value;
    const productsText = document.getElementById('products').value;
    const tone = document.getElementById('tone').value;
    const template = document.querySelector('input[name="template"]:checked').value;

    const products = productsText.split(',').map(p => p.trim());

    showLoadingOverlay(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName,
          tagline,
          description,
          about,
          products: JSON.stringify(products),
          tone,
          template
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${businessName.replace(/\s+/g, '-')}-website.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showLoadingOverlay(false);

        // Show success message
        successMessage.style.display = 'block';
        successMessage.style.animation = 'slideUp 0.6s ease-out';
        previewSection.style.display = 'none';

        showNotification('Website downloaded! 🎉', 'success');

        // Reset after 4 seconds
        setTimeout(resetForm, 4000);
      } else {
        showLoadingOverlay(false);
        showNotification('Failed to generate website', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showLoadingOverlay(false);
      showNotification('Error generating website: ' + error.message, 'error');
    }
  };

  // Reset form to initial state
  window.resetForm = function() {
    inputForm.style.display = 'block';
    inputForm.style.animation = 'slideUp 0.4s ease-out';
    suggestionsSection.style.display = 'none';
    editForm.style.display = 'none';
    previewSection.style.display = 'none';
    successMessage.style.display = 'none';
    loadingSpinner.style.display = 'none';
    inputForm.reset();
    aiSuggestions = {};
    previewHTML = '';
    currentStep = 1;
    updateStepIndicator(1);
  };

  // Show notification toast
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Show/hide loading overlay
  function showLoadingOverlay(show) {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <p>Processing...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = show ? 'flex' : 'none';
  }

  // Add styles for notifications and overlay
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 14px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      font-size: 0.95em;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
      z-index: 9999;
      max-width: 300px;
      word-wrap: break-word;
    }

    .notification-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .notification-error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .notification-info {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      backdrop-filter: blur(2px);
    }

    .loading-spinner {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .spinner-ring {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(99, 102, 241, 0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-spinner p {
      color: #64748b;
      font-weight: 600;
      margin: 0;
    }

    @media (max-width: 480px) {
      .notification {
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `;
  document.head.appendChild(style);

  // Add smooth scroll to sections
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Prevent form submission on enter in textarea
  document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
      }
    });
  });

} else {
  // ===== GENERATED WEBSITE LOGIC =====

  // Smooth scrolling for navigation links
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

  // Handle contact form submission
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 15px;
        font-weight: 600;
        animation: slideDown 0.4s ease-out;
      `;
      successMsg.textContent = '✓ Thank you! We will get back to you soon.';
      
      this.parentNode.insertBefore(successMsg, this);
      
      // Reset form
      this.reset();
      
      // Remove message after 4 seconds
      setTimeout(() => {
        successMsg.style.animation = 'slideUp 0.4s ease-out forwards';
        setTimeout(() => successMsg.remove(), 400);
      }, 4000);
    });
  }

  // Handle CTA buttons with smooth scroll
  const ctaButtons = document.querySelectorAll('.cta-button');
  ctaButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      if (!this.form) {
        e.preventDefault();
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Add scroll animation to elements
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe service cards and sections
  document.querySelectorAll('.service-card, .modern-service-item, .about-section').forEach(el => {
    observer.observe(el);
  });

  // Add animation styles for generated website
  const generatedStyle = document.createElement('style');
  generatedStyle.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .service-card, .modern-service-item, .about-section {
      opacity: 0;
    }

    .contact-form input:focus,
    .contact-form textarea:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(generatedStyle);
}
