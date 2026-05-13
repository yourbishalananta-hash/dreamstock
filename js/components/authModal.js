// ============================================
// AUTHENTICATION MODAL COMPONENT
// ============================================

class AuthModal {
  constructor() {
    this.modal = document.getElementById('modalOverlay');
    this.container = document.getElementById('modalContainer');
  }

  show(mode = 'login') {
    this.render(mode);
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    this.attachEvents(mode);
  }

  hide() {
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
  }

  render(mode) {
    const isLogin = mode === 'login';
    
    this.container.innerHTML = `
      <div class="auth-modal">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fas fa-chart-line"></i>
            <h2>Dream<span>Stock</span></h2>
          </div>
          <button class="auth-close" id="authClose">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="auth-tabs">
          <button class="auth-tab ${isLogin ? 'active' : ''}" data-tab="login">
            Sign In
          </button>
          <button class="auth-tab ${!isLogin ? 'active' : ''}" data-tab="signup">
            Create Account
          </button>
        </div>

        <div class="auth-body">
          ${isLogin ? this.renderLoginForm() : this.renderSignupForm()}
        </div>

        <div class="auth-footer">
          <p class="auth-message" id="authMessage"></p>
        </div>
      </div>
    `;
  }

  renderLoginForm() {
    return `
      <form id="loginForm" class="auth-form">
        <div class="form-group">
          <label for="loginUsername">
            <i class="fas fa-user"></i> Username
          </label>
          <input type="text" id="loginUsername" class="form-control" 
                 placeholder="Enter your username" required autocomplete="username">
        </div>
        
        <div class="form-group">
          <label for="loginPassword">
            <i class="fas fa-lock"></i> Password
          </label>
          <div class="password-input-wrapper">
            <input type="password" id="loginPassword" class="form-control" 
                   placeholder="Enter your password" required autocomplete="current-password">
            <button type="button" class="password-toggle" data-target="loginPassword">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" id="rememberMe">
            <span>Remember me</span>
          </label>
          <a href="#" class="forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg">
          <i class="fas fa-sign-in-alt"></i> Sign In
        </button>
      </form>
    `;
  }

  renderSignupForm() {
    return `
      <form id="signupForm" class="auth-form">
        <div class="form-group">
          <label for="signupUsername">
            <i class="fas fa-user"></i> Username
          </label>
          <input type="text" id="signupUsername" class="form-control" 
                 placeholder="Choose a username" required minlength="3">
        </div>

        <div class="form-group">
          <label for="signupEmail">
            <i class="fas fa-envelope"></i> Email (Optional)
          </label>
          <input type="email" id="signupEmail" class="form-control" 
                 placeholder="Enter your email">
        </div>
        
        <div class="form-group">
          <label for="signupPassword">
            <i class="fas fa-lock"></i> Password
          </label>
          <div class="password-input-wrapper">
            <input type="password" id="signupPassword" class="form-control" 
                   placeholder="Create a password" required minlength="6">
            <button type="button" class="password-toggle" data-target="signupPassword">
              <i class="fas fa-eye"></i>
            </button>
          </div>
          <div class="password-strength" id="passwordStrength">
            <div class="strength-bar"></div>
            <span class="strength-text"></span>
          </div>
        </div>

        <div class="form-group">
          <label for="signupConfirmPassword">
            <i class="fas fa-lock"></i> Confirm Password
          </label>
          <input type="password" id="signupConfirmPassword" class="form-control" 
                 placeholder="Confirm your password" required>
        </div>

        <div class="terms-agreement">
          <label>
            <input type="checkbox" id="agreeTerms" required>
            <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg">
          <i class="fas fa-user-plus"></i> Create Account
        </button>
      </form>
    `;
  }

  attachEvents(mode) {
    // Close button
    const closeBtn = document.getElementById('authClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const newMode = e.currentTarget.dataset.tab;
        this.render(newMode);
        this.attachEvents(newMode);
      });
    });

    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.target;
        const input = document.getElementById(targetId);
        const icon = e.currentTarget.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
      });
    });

    // Form submissions
    if (mode === 'login') {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin();
        });
      }
    } else {
      const signupForm = document.getElementById('signupForm');
      if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSignup();
        });
      }

      // Password strength checker
      const passwordInput = document.getElementById('signupPassword');
      if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
          this.checkPasswordStrength(e.target.value);
        });
      }
    }

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const result = authManager.login(username, password);
    
    if (result.success) {
      this.showMessage('Login successful! Welcome back, ' + username + '!', 'success');
      setTimeout(() => {
        this.hide();
        // Trigger data load event
        if (typeof eventBus !== 'undefined') {
          eventBus.emit('user:loggedIn', { username });
        }
        // Reload the current view to reflect user data
        if (window.app) {
          window.app.loadUserData();
          window.app.updateUIForUser();
        }
      }, 1000);
    } else {
      this.showMessage(result.message, 'error');
    }
  }

  handleSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
      this.showMessage('Passwords do not match!', 'error');
      return;
    }

    if (username.length < 3) {
      this.showMessage('Username must be at least 3 characters!', 'error');
      return;
    }

    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters!', 'error');
      return;
    }

    const result = authManager.signup(username, password, email);
    
    if (result.success) {
      this.showMessage('Account created successfully! Welcome to DreamStock!', 'success');
      setTimeout(() => {
        this.hide();
        if (typeof eventBus !== 'undefined') {
          eventBus.emit('user:loggedIn', { username });
        }
        if (window.app) {
          window.app.loadUserData();
          window.app.updateUIForUser();
        }
      }, 1500);
    } else {
      this.showMessage(result.message, 'error');
    }
  }

  checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;

    let strength = 0;
    let color = '#dc2626';
    let text = 'Weak';

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        color = '#dc2626';
        text = 'Weak';
        break;
      case 2:
        color = '#f59e0b';
        text = 'Fair';
        break;
      case 3:
        color = '#3b82f6';
        text = 'Good';
        break;
      case 4:
      case 5:
        color = '#10b981';
        text = 'Strong';
        break;
    }

    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
  }

  showMessage(message, type) {
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `auth-message ${type}`;
      
      // Auto clear after 5 seconds
      setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'auth-message';
      }, 5000);
    }
  }
}

// Create global instance
const authModal = new AuthModal();
