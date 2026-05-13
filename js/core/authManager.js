// ============================================
// AUTHENTICATION MANAGER
// ============================================

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
  }

  // Load all users from localStorage
  loadUsers() {
    try {
      const users = localStorage.getItem('dreamstock_users');
      return users ? JSON.parse(users) : {};
    } catch (e) {
      console.error('Error loading users:', e);
      return {};
    }
  }

  // Save users to localStorage
  saveUsers() {
    try {
      localStorage.setItem('dreamstock_users', JSON.stringify(this.users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }

  // Hash password (simple implementation - use bcrypt in production)
  hashPassword(password) {
    let hash = 0;
    const salt = 'DreamStockSalt2024';
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Sign up new user
  signup(username, password, email = '') {
    // Validate inputs
    if (!username || username.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    if (this.users[username]) {
      return { success: false, message: 'Username already exists' };
    }

    // Create user
    const hashedPassword = this.hashPassword(password);
    this.users[username] = {
      username: username,
      password: hashedPassword,
      email: email,
      createdAt: new Date().toISOString(),
      data: {
        watchlist: [],
        portfolio: {
          holdings: [],
          transactions: [],
          balance: 100000 // Starting balance of ₹1,00,000
        },
        alerts: [],
        settings: {
          theme: 'light',
          notifications: true,
          currency: 'INR'
        }
      }
    };

    this.saveUsers();
    this.currentUser = username;
    this.saveSession(username);
    
    return { success: true, message: 'Account created successfully!', username };
  }

  // Login user
  login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Please enter username and password' };
    }

    const user = this.users[username];
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const hashedPassword = this.hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, message: 'Invalid password' };
    }

    this.currentUser = username;
    this.saveSession(username);
    
    return { success: true, message: 'Login successful!', username };
  }

  // Logout user
  logout() {
    this.currentUser = null;
    localStorage.removeItem('dreamstock_session');
    return { success: true, message: 'Logged out successfully' };
  }

  // Save session
  saveSession(username) {
    try {
      localStorage.setItem('dreamstock_session', JSON.stringify({
        username: username,
        loginTime: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error saving session:', e);
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    if (this.currentUser) return true;
    
    // Check session
    try {
      const session = localStorage.getItem('dreamstock_session');
      if (session) {
        const sessionData = JSON.parse(session);
        if (sessionData.username && this.users[sessionData.username]) {
          this.currentUser = sessionData.username;
          return true;
        }
      }
    } catch (e) {
      console.error('Error checking session:', e);
    }
    
    return false;
  }

  // Get current user data
  getUserData() {
    if (!this.currentUser) return null;
    return this.users[this.currentUser]?.data || null;
  }

  // Update user data
  updateUserData(data) {
    if (!this.currentUser || !this.users[this.currentUser]) return false;
    
    this.users[this.currentUser].data = {
      ...this.users[this.currentUser].data,
      ...data
    };
    
    this.saveUsers();
    return true;
  }

  // Get specific data type
  getWatchlist() {
    const userData = this.getUserData();
    return userData?.watchlist || [];
  }

  getPortfolio() {
    const userData = this.getUserData();
    return userData?.portfolio || { holdings: [], transactions: [], balance: 100000 };
  }

  getAlerts() {
    const userData = this.getUserData();
    return userData?.alerts || [];
  }

  // Update specific data types
  updateWatchlist(watchlist) {
    const userData = this.getUserData();
    if (userData) {
      userData.watchlist = watchlist;
      this.updateUserData(userData);
    }
  }

  updatePortfolio(portfolio) {
    const userData = this.getUserData();
    if (userData) {
      userData.portfolio = portfolio;
      this.updateUserData(userData);
    }
  }

  updateAlerts(alerts) {
    const userData = this.getUserData();
    if (userData) {
      userData.alerts = alerts;
      this.updateUserData(userData);
    }
  }

  // Get all users (for admin)
  getAllUsers() {
    return Object.keys(this.users).map(username => ({
      username,
      email: this.users[username].email,
      createdAt: this.users[username].createdAt
    }));
  }
}

// Create global instance
const authManager = new AuthManager();
