(function () {
    const CSS_HREF = '/css/css-others/auth-popover.css';
    if (!document.querySelector(`link[data-auth-popover-css="true"]`)) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', CSS_HREF);
        link.setAttribute('data-auth-popover-css', 'true');
        document.head.appendChild(link);
    }

    function el(tag, props = {}, ...children) {
        const node = document.createElement(tag);
        Object.entries(props).forEach(([k, v]) => {
            if (k === 'class') node.className = v;
            else if (k === 'text') node.textContent = v;
            else node.setAttribute(k, v);
        });
        children.forEach(c => {
            if (typeof c === 'string') node.appendChild(document.createTextNode(c));
            else if (c) node.appendChild(c);
        });
        return node;
    }

    let currentUser = null;
    let popover = null;
    let activeTab = 'login';

    async function api(path, opts = {}) {
        opts.credentials = 'same-origin';
        opts.headers = opts.headers || {};
        if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(opts.body);
        }
        const r = await fetch(path, opts);
        let body = null;
        try {
            body = await r.clone().json();
        } catch (e) {
            body = await r.text().catch(() => null);
        }
        return { ok: r.ok, status: r.status, body };
    }

    function getRoot() {
        let root = document.getElementById('authWidget');
        if (!root) {
            root = el('div', { id: 'authWidget' });
            document.body.appendChild(root);
        }
        root.classList.add('auth-widget');
        return root;
    }

    function renderBar() {
        const headerTrigger = document.querySelector('.glitch-text');
        if (!headerTrigger) return;

        // Atualiza o texto principal (em vez de meta)
        if (currentUser && currentUser.userName) {
            headerTrigger.textContent = `${currentUser.userName}@pwn`;
        } else {
            headerTrigger.textContent = `guest@pwn`;
        }

        ensurePopover(getRoot());
    }

    async function attachTrigger() {
        const headerTrigger = document.querySelector('.glitch-text');
        const root = getRoot();
        root.innerHTML = '';
        if (headerTrigger) {
            headerTrigger.classList.add('auth-trigger');
            headerTrigger.addEventListener('click', ev => {
                ev.preventDefault();
                togglePopover(headerTrigger);
            });
            ensurePopover(root);
            positionPopoverUnder(headerTrigger);
        } else {
            const btn = el('button', { class: 'btn', text: 'Account' });
            btn.addEventListener('click', () => togglePopover(btn));
            root.appendChild(btn);
            ensurePopover(root);
        }
    }

    function positionPopoverUnder(triggerEl) {
        if (!popover) return;

        const rect = triggerEl.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const root = getRoot();

        let wrapper = root.querySelector('.auth-popover-wrapper');
        if (!wrapper) {
            wrapper = el('div', { class: 'auth-popover-wrapper' });
            root.appendChild(wrapper);
        }

        // === largura e posição ===
        const popW = 75; // usa o mesmo valor da largura no CSS
        let left = rect.left + window.scrollX; // alinhado à borda esquerda do header

        // se quiser alinhar com leve margem interna (por estética)
        // ex: let left = rect.left + window.scrollX + 2;

        // Evita que passe dos cantos da tela
        const viewportW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        if (left + popW > viewportW - 8) left = viewportW - popW - 8;
        if (left < 8) left = 8;

        // === posição vertical ===
        wrapper.style.left = left + 'px';
        wrapper.style.top = rect.bottom + scrollY + 6 + 'px';

        wrapper.appendChild(popover);
    }

    function ensurePopover(root) {
        if (!popover) {
            popover = el('div', { class: 'aw-popover', style: 'display:none' });
            buildLoginPopover();
            root.appendChild(popover);
        }
    }

    function buildLoginPopover() {
        popover.innerHTML = '';

        const tabs = el('div', { class: 'tabs' });
        const tLogin = el('div', { class: 'aw-tab active', id: 'tab-login', text: 'Login' });
        const tRegister = el('div', { class: 'aw-tab', id: 'tab-register', text: 'Register' });
        tabs.appendChild(tLogin);
        tabs.appendChild(tRegister);

        const err = el('div', { class: 'aw-error', id: 'aw-error' });
        const title = el('div', { class: 'aw-pop-title', id: 'aw-pop-title', text: 'guest@pwn' });

        const fUser = el('div', { class: 'aw-field' },
            el('label', { text: 'User name' }),
            el('input', { type: 'text', id: 'aw-user' })
        );

        const fPass = el('div', { class: 'aw-field' },
            el('label', { text: 'Password' }),
            el('input', { type: 'password', id: 'aw-pass' })
        );

        const actions = el('div', { class: 'aw-actions' });
        const submit = el('button', { class: 'aw-btn', id: 'aw-submit', text: 'Sign in' });
        const closeBtn = el('button', { class: 'aw-btn secondary', id: 'aw-close', text: 'Close' });
        closeBtn.addEventListener('click', hidePopover);
        actions.appendChild(closeBtn);
        actions.appendChild(submit);

        popover.appendChild(title);
        popover.appendChild(tabs);
        popover.appendChild(err);
        popover.appendChild(fUser);
        popover.appendChild(fPass);
        popover.appendChild(actions);

        tLogin.addEventListener('click', () => setActiveTab('login'));
        tRegister.addEventListener('click', () => setActiveTab('register'));

        submit.addEventListener('click', async () => {
            const userName = document.getElementById('aw-user').value.trim();
            const password = document.getElementById('aw-pass').value;
            const errorEl = document.getElementById('aw-error');
            errorEl.textContent = '';
            if (!userName || !password) {
                errorEl.textContent = 'user & password required';
                return;
            }
            try {
                let r;
                if (activeTab === 'login') {
                    r = await api('/api/login', { method: 'POST', body: { userName, password } });
                } else {
                    r = await api('/api/register', { method: 'POST', body: { userName, password } });
                }
                if (!r.ok) {
                    errorEl.textContent = r.body && (r.body.error || JSON.stringify(r.body)) || 'failed';
                    return;
                }
                await refreshUser();
                hidePopover();
            } catch (e) {
                errorEl.textContent = e.message;
            }
        });
    }

    function buildUserPopover() {
        popover.innerHTML = '';

        // === Info principal ===
        const info = el('div', {
            class: 'aw-info',
            text: `worm: ${!!currentUser.worm}`
        });
        popover.appendChild(info);

        // === Upload (logo abaixo do worm info) ===
        if (currentUser.worm) {
            const uploadBtn = el('button', { class: 'aw-btn', text: 'Upload' });
            const uploadLinks = el('div', {
                class: 'aw-upload-links',
                style: 'display:none;'
            },
                el('a', { href: '/u/file', class: 'aw-link', text: 'upload_file' }),
                el('a', { href: '/u/papers', class: 'aw-link', text: 'upload_paper' })
            );

            uploadBtn.addEventListener('click', () => {
                uploadLinks.style.display = uploadLinks.style.display === 'none' ? 'flex' : 'none';
            });

            popover.appendChild(uploadBtn);
            popover.appendChild(uploadLinks);
        }

        // === Botões de ação (logout etc) ===
        const actions = el('div', { class: 'aw-actions' });

        const logoutBtn = el('button', { class: 'aw-btn secondary', text: 'Logout' });
        logoutBtn.addEventListener('click', async () => {
            await api('/api/logout', { method: 'POST' });
            currentUser = null;
            renderBar();
            buildLoginPopover();
        });

        actions.appendChild(logoutBtn);
        popover.appendChild(actions);
    }

    function setActiveTab(tab) {
        activeTab = tab;
        if (!popover) return;
        const tLogin = popover.querySelector('#tab-login');
        const tRegister = popover.querySelector('#tab-register');
        const submit = popover.querySelector('#aw-submit');
        const errorEl = popover.querySelector('#aw-error');
        errorEl.textContent = '';
        if (tab === 'login') {
            tLogin.classList.add('active');
            tRegister.classList.remove('active');
            submit.textContent = 'Sign in';
        } else {
            tLogin.classList.remove('active');
            tRegister.classList.add('active');
            submit.textContent = 'Create';
        }
    }

    function togglePopover() {
        ensurePopover(getRoot());
        if (popover.style.display === 'none' || !popover.style.display) {
            if (currentUser) buildUserPopover();
            else buildLoginPopover();
            popover.style.display = 'block';
        } else {
            hidePopover();
        }
    }

    function hidePopover() {
        if (popover) popover.style.display = 'none';
    }

    async function refreshUser() {
        try {
            const r = await api('/api/me');
            if (r.ok && r.body && r.body.user) {
                currentUser = r.body.user;
            } else currentUser = null;
        } catch (e) {
            currentUser = null;
        }
        renderBar();
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderBar();
        refreshUser().then(() => attachTrigger());
        window.authWidget = {
            refresh: refreshUser,
            open: () => togglePopover()
        };
    });
})();
