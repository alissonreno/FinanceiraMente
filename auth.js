// EmailJS configuration
(function() {
    emailjs.init("YOUR_USER_ID_FROM_EMAILJS");
})();

let currentUser = null;
const ADMIN_EMAIL = "abelardoandradesilva@gmail.com";
const APPROVAL_TEMPLATE_ID = "template_approval"; 
const SERVICE_ID = "service_financeapp"; 

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupAuthListeners();
});

function checkLoginStatus() {
    const user = localStorage.getItem('financeApp_user');
    if (user) {
        try {
            currentUser = JSON.parse(user);
            if (!currentUser.approved) {
                mostrarNotificacao("Sua conta ainda está aguardando aprovação.", "warning");
                logout();
                return;
            }
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            document.getElementById('user-name').textContent = currentUser.name;
            initializeAppForUser(currentUser.email);
        } catch (e) {
            console.error("Error parsing user data", e);
            logout();
        }
    }
}

function setupAuthListeners() {
    document.getElementById('login-tab-btn').addEventListener('click', function() {
        switchTab('login-tab');
    });
    document.getElementById('register-tab-btn').addEventListener('click', function() {
        switchTab('register-tab');
    });
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegistration();
    });
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-recuperar-senha').style.display = 'block';
    });
    document.getElementById('form-recuperar-senha').addEventListener('submit', function(e) {
        e.preventDefault();
        handlePasswordRecovery();
    });
    document.getElementById('btn-cancelar-recuperar').addEventListener('click', function() {
        document.getElementById('modal-recuperar-senha').style.display = 'none';
    });
    document.getElementById('btn-cadastro-status-ok').addEventListener('click', function() {
        document.getElementById('modal-cadastro-status').style.display = 'none';
    });
    document.getElementById('btn-logout').addEventListener('click', function() {
        logout();
    });
    document.querySelectorAll('.close').forEach(function(btn) {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.auth-box .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-box .tab-content').forEach(function(content) {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const users = JSON.parse(localStorage.getItem('financeApp_users') || '[]');
    const user = users.find(u => u.email === email);
    if (!user) {
        mostrarNotificacao("Email não cadastrado.", "error");
        return;
    }
    if (user.password !== hashPassword(password)) {
        mostrarNotificacao("Senha incorreta.", "error");
        return;
    }
    if (!user.approved) {
        mostrarNotificacao("Sua conta ainda está aguardando aprovação.", "warning");
        return;
    }
    currentUser = {
        name: user.name,
        email: user.email,
        approved: user.approved
    };
    localStorage.setItem('financeApp_user', JSON.stringify(currentUser));
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.name;
    initializeAppForUser(currentUser.email);
    mostrarNotificacao(`Bem-vindo(a), ${currentUser.name}!`);
}

function handleRegistration() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    if (password !== confirmPassword) {
        mostrarNotificacao("As senhas não conferem.", "error");
        return;
    }
    const users = JSON.parse(localStorage.getItem('financeApp_users') || '[]');
    if (users.some(u => u.email === email)) {
        mostrarNotificacao("Este email já está cadastrado.", "error");
        return;
    }
    const newUser = {
        name,
        email,
        password: hashPassword(password),
        approved: false,
        created: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('financeApp_users', JSON.stringify(users));
    sendApprovalEmail(newUser);
    document.getElementById('register-form').reset();
    document.getElementById('modal-cadastro-status').style.display = 'block';
    switchTab('login-tab');
}

function sendApprovalEmail(user) {
    const approvalToken = generateApprovalToken(user.email);
    const approvalTokens = JSON.parse(localStorage.getItem('financeApp_approvalTokens') || '{}');
    approvalTokens[user.email] = approvalToken;
    localStorage.setItem('financeApp_approvalTokens', JSON.stringify(approvalTokens));
    const approvalUrl = `${window.location.origin}/approve.html?token=${approvalToken}&email=${encodeURIComponent(user.email)}`;
    const templateParams = {
        admin_email: ADMIN_EMAIL,
        user_name: user.name,
        user_email: user.email,
        approval_url: approvalUrl,
        created_date: new Date().toLocaleString()
    };
    emailjs.send(SERVICE_ID, APPROVAL_TEMPLATE_ID, templateParams)
        .then(function(response) {
            console.log('Email enviado!', response.status, response.text);
        }, function(error) {
            console.log('Erro ao enviar email:', error);
        });
    console.log("Email de aprovação seria enviado para:", ADMIN_EMAIL);
    console.log("Link de aprovação:", approvalUrl);
    setTimeout(() => {
        approveUser(user.email);
    }, 5000);
}

function handlePasswordRecovery() {
    const email = document.getElementById('recuperar-email').value;
    const users = JSON.parse(localStorage.getItem('financeApp_users') || '[]');
    if (!users.some(u => u.email === email)) {
        mostrarNotificacao("Email não encontrado.", "error");
        return;
    }
    mostrarNotificacao("Instruções para recuperação de senha foram enviadas para seu email.", "success");
    document.getElementById('modal-recuperar-senha').style.display = 'none';
    document.getElementById('form-recuperar-senha').reset();
}

function approveUser(email) {
    const users = JSON.parse(localStorage.getItem('financeApp_users') || '[]');
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
        users[userIndex].approved = true;
        localStorage.setItem('financeApp_users', JSON.stringify(users));
        console.log(`User ${email} approved!`);
    }
}

function initializeAppForUser(userEmail) {
    initDatabase().then(success => {
        if (success) {
            const dataAtual = new Date();
            mesAtual = dataAtual.getMonth() + 1; 
            anoAtual = dataAtual.getFullYear();
            preencherSelectAnos();
            mesSelect.value = mesAtual;
            anoSelect.value = anoAtual;
            carregarDadosPeriodo(mesAtual, anoAtual);
            carregarMesesArquivados();
        }
    });
}

function logout() {
    currentUser = null;
    localStorage.removeItem('financeApp_user');
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-form').reset();
}

function generateApprovalToken(email) {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    return hash.toString(36);
}