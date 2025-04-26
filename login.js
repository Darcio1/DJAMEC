/**
 * Script de Login
 * Responsável por controlar a interação do usuário com o formulário de login
 * e integrar com o sistema de autenticação.
 */

// DJAMEC Portal Educacional - Sistema de Autenticação
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do Sistema
    initTheme();
    setupEventListeners();
    
    // Inicializar o sistema de autenticação
    window.authSystem = new AuthSystem();
    
    // Verificar se já está autenticado e redirecionar
    if (window.authSystem.isAuthenticated()) {
        window.location.href = 'dashboard-admin.html';
    }
});

// Configurar event listeners
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginButton = document.getElementById('loginBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // Envio do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberMeCheckbox.checked;
            
            if (!username || !password) {
                showFeedback(usernameInput, 'Por favor, preencha todos os campos', true);
                return;
            }
            
            // Mostrar indicador de carregamento
            loginButton.classList.add('loading');
            document.querySelector('.spinner').style.display = 'inline-block';
            
            try {
                // Usar o sistema de autenticação para fazer login
                const authResult = await window.authSystem.authenticate(username, password, rememberMe);
                console.log('Resultado da autenticação:', authResult);
                
                if (authResult.success) {
                    // Login bem-sucedido
                    showNotification(authResult.message, 'success');
                    
                    // Redirecionar para o dashboard após 1 segundo
                    setTimeout(() => {
                        window.location.href = 'dashboard-admin.html';
                    }, 1000);
                } else {
                    // Login falhou
                    showFeedback(passwordInput, authResult.message, true);
                    hideLoading();
                }
            } catch (error) {
                console.error("Erro durante autenticação:", error);
                showFeedback(passwordInput, 'Ocorreu um erro durante a autenticação', true);
                hideLoading();
            }
        });
    }
    
    // Mostrar/ocultar senha
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Mudar o ícone
            togglePasswordBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Verificar força da senha durante a digitação
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = checkPasswordStrength(password);
            updatePasswordStrengthMeter(strength);
            
            if (document.querySelector('.typing-indicator')) {
                document.querySelector('.typing-indicator').classList.add('visible');
                
                // Ocultar indicador após um tempo
                clearTimeout(window.typingTimer);
                window.typingTimer = setTimeout(() => {
                    document.querySelector('.typing-indicator').classList.remove('visible');
                }, 1000);
            }
        });
        
        passwordInput.addEventListener('focus', () => {
            document.querySelector('.password-strength').classList.add('visible');
        });
    }
    
    // Alternar tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// Verificar força da senha
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Comprimento mínimo
    if (password.length >= 8) strength += 1;
    
    // Letras maiúsculas e minúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    
    // Números e caracteres especiais
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return strength;
}

// Atualizar o medidor de força da senha
function updatePasswordStrengthMeter(strength) {
    const meterBar = document.querySelector('.strength-meter-bar');
    const meterLabel = document.querySelector('.strength-meter-label');
    
    if (!meterBar || !meterLabel) return;
    
    // Remover classes anteriores
    meterBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
    
    // Adicionar a classe apropriada
    if (strength === 0) {
        meterBar.style.width = '0';
        meterLabel.textContent = 'Muito fraca';
    } else if (strength === 1) {
        meterBar.classList.add('strength-weak');
        meterLabel.textContent = 'Fraca';
    } else if (strength === 2) {
        meterBar.classList.add('strength-medium');
        meterLabel.textContent = 'Média';
    } else {
        meterBar.classList.add('strength-strong');
        meterLabel.textContent = 'Forte';
    }
}

// Mostrar feedback nos campos
function showFeedback(inputElement, message, isError = false) {
    const feedbackElement = inputElement.nextElementSibling.nextElementSibling;
    
    if (feedbackElement && feedbackElement.classList.contains('feedback-message')) {
        feedbackElement.textContent = message;
        feedbackElement.style.color = isError ? 'var(--danger-color)' : 'var(--success-color)';
        
        if (isError) {
            inputElement.style.borderColor = 'var(--danger-color)';
            inputElement.style.boxShadow = '0 0 0 2px rgba(220, 53, 69, 0.25)';
            
            // Limpar erro após 3 segundos
            setTimeout(() => {
                feedbackElement.textContent = '';
                inputElement.style.borderColor = '';
                inputElement.style.boxShadow = '';
            }, 3000);
        }
    }
}

// Ocultar indicadores de carregamento
function hideLoading() {
    const loginButton = document.getElementById('loginBtn');
    if (loginButton) loginButton.classList.remove('loading');
    
    const spinner = document.querySelector('.spinner');
    if (spinner) spinner.style.display = 'none';
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Verificar se já existe um container de notificações
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Criar a notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Ícone baseado no tipo
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `
        ${icon}
        <span>${message}</span>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar ao container
    notificationContainer.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Configurar o botão de fechar
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto-remover após alguns segundos
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

// Remover notificação com animação
function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// Inicializar tema com base na preferência do usuário
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        // Verificar preferência do sistema
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkScheme) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeIcon('dark');
        }
    }
}

// Alternar entre temas claro e escuro
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
}

// Atualizar o ícone do botão de tema
function updateThemeIcon(theme) {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
} 