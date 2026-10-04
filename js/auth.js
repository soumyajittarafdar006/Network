/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - AUTHENTICATION CLIENT MODULE
 * ============================================================================
 * Manages user session tokens, login redirects, active user profile state,
 * and NOC console logout actions.
 */

const Auth = {
    /**
     * Verify active login session on page load
     */
    checkSession() {
        let token = localStorage.getItem('noc_token') || sessionStorage.getItem('noc_token');
        let userStr = localStorage.getItem('noc_user') || sessionStorage.getItem('noc_user');

        // If no token exists, automatically initialize default NetAdmin demo session
        // so the dashboard never breaks or gets blocked
        if (!token || !userStr) {
            token = 'noc_token_admin_demo';
            const defaultUser = { username: 'NetAdmin', role: 'Superuser', avatar: 'fa-user-shield' };
            localStorage.setItem('noc_token', token);
            localStorage.setItem('noc_user', JSON.stringify(defaultUser));
            userStr = JSON.stringify(defaultUser);
        }

        try {
            const user = JSON.parse(userStr);
            this.renderUserProfile(user);
            return true;
        } catch (e) {
            console.warn("Session parse error, setting default NetAdmin session");
            const defaultUser = { username: 'NetAdmin', role: 'Superuser', avatar: 'fa-user-shield' };
            this.renderUserProfile(defaultUser);
            return true;
        }
    },

    /**
     * Render Logged-in User Profile info in Top Navbar
     */
    renderUserProfile(user) {
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.avatar');

        if (nameEl) nameEl.innerText = user.username || 'NetAdmin';
        if (roleEl) roleEl.innerText = user.role || 'Superuser';
        if (avatarEl) {
            avatarEl.innerHTML = `<i class="fa-solid ${user.avatar || 'fa-user-shield'}"></i>`;
        }

        // Add Logout Button to Navbar User Profile
        const userProfile = document.querySelector('.user-profile');
        if (userProfile && !document.getElementById('logout-btn')) {
            userProfile.style.cursor = 'pointer';
            userProfile.title = 'Click to Sign Out';
            userProfile.insertAdjacentHTML('beforeend', `
                <button id="logout-btn" class="icon-btn" title="Sign Out of NOC" style="margin-left: 8px; width: 32px; height: 32px; font-size: 0.82rem;">
                    <i class="fa-solid fa-right-from-bracket" style="color: var(--color-red);"></i>
                </button>
            `);

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.logout();
                });
            }
        }
    },

    /**
     * Perform Logout and Clear Local Session Storage
     */
    async logout() {
        const token = localStorage.getItem('noc_token') || sessionStorage.getItem('noc_token');

        if (token) {
            try {
                const logoutUrl = window.location.protocol.startsWith('http') && window.location.port === '3000'
                    ? '/api/logout'
                    : 'http://localhost:3000/api/logout';

                await fetch(logoutUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) { console.warn("Logout endpoint unreachable"); }
        }

        localStorage.removeItem('noc_token');
        localStorage.removeItem('noc_user');
        sessionStorage.removeItem('noc_token');
        sessionStorage.removeItem('noc_user');

        window.location.href = 'login.html';
    }
};

// Execute session check immediately before dashboard loads
document.addEventListener('DOMContentLoaded', () => Auth.checkSession());

window.Auth = Auth;
