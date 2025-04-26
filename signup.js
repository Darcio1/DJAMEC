/**
 * Script de Cadastro
 * Responsável por controlar a interação do usuário com o formulário de cadastro
 * e integrar com o sistema de autenticação.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do Sistema
    initTheme();
    setupEventListeners();
    
    // Inicializar o sistema de autenticação
    window.authSystem = new AuthSystem();
    
    // Não verificamos autenticação aqui, pois queremos que usuários não autenticados
    // possam acessar a página de cadastro

    console.log('Página de cadastro carregada com sucesso');
    
    // Mostrar requisitos de senha
    const passwordInfo = document.createElement('div');
    passwordInfo.className = 'password-requirements';
    passwordInfo.innerHTML = `
        <p>A senha deve conter:</p>
        <ul>
            <li id="req-length">Pelo menos 8 caracteres</li>
            <li id="req-case">Letras maiúsculas e minúsculas</li>
            <li id="req-number">Pelo menos um número</li>
            <li id="req-special">Pelo menos um caractere especial</li>
        </ul>
    `;
    
    // Inserir após o medidor de força da senha
    const passwordStrength = document.querySelector('#passwordStrength');
    if (passwordStrength) {
        passwordStrength.after(passwordInfo);
    }
});

// Configurar event listeners
function setupEventListeners() {
    const signupForm = document.getElementById('signupForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupButton = document.getElementById('signupBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    console.log('Elementos do formulário:', { 
        formulário: signupForm ? 'Encontrado' : 'Não encontrado',
        botãoCadastro: signupButton ? 'Encontrado' : 'Não encontrado'
    });
    
    // Verificação em tempo real da força da senha
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const result = validatePassword(password);
            
            // Atualizar indicadores visuais dos requisitos
            document.getElementById('req-length').className = result.hasMinLength ? 'met' : '';
            document.getElementById('req-case').className = result.hasMixedCase ? 'met' : '';
            document.getElementById('req-number').className = result.hasNumber ? 'met' : '';
            document.getElementById('req-special').className = result.hasSpecial ? 'met' : '';
            
            // Atualizar medidor
            updatePasswordStrengthMeter(result.strength);
        });
    }
    
    // Verificação em tempo real de nome de usuário já existente
    if (usernameInput) {
        let usernameCheckTimeout;
        usernameInput.addEventListener('input', () => {
            const username = usernameInput.value.trim();
            
            // Verificar formato do nome de usuário
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (username.length > 0 && !usernameRegex.test(username)) {
                showFeedback(usernameInput, 'Nome de usuário deve conter apenas letras, números e underscore', true);
                return;
            }
            
            // Limpar feedback de formato inválido se o formato estiver correto
            if (username.length > 0 && usernameRegex.test(username)) {
                const feedbackElement = usernameInput.nextElementSibling.nextElementSibling;
                if (feedbackElement && feedbackElement.textContent.includes('formato')) {
                    feedbackElement.textContent = '';
                    usernameInput.style.borderColor = '';
                    usernameInput.style.boxShadow = '';
                }
            }
            
            // Verificar disponibilidade do nome de usuário apenas se tiver pelo menos 3 caracteres
            if (username.length >= 3) {
                // Limpar timeout anterior para evitar múltiplas requisições
                clearTimeout(usernameCheckTimeout);
                
                // Adicionar indicador de carregamento
                showFeedback(usernameInput, 'Verificando disponibilidade...', false, true);
                
                // Definir novo timeout (delay de 500ms para evitar muitas requisições)
                usernameCheckTimeout = setTimeout(async () => {
                    try {
                        // Primeiro verificar no banco de dados local
                        const userExists = await window.authSystem.checkUserExists(username);
                        
                        if (userExists) {
                            showFeedback(usernameInput, 'Este nome de usuário já está em uso', true);
                        } else {
                            // Se não existir localmente, verificar disponibilidade no backend
                            try {
                                const response = await fetch(`${window.authSystem.apiUrl}/auth/check-username?username=${username}`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).catch(() => ({ ok: false }));
                                
                                if (response.ok) {
                                    const data = await response.json();
                                    if (data.exists) {
                                        showFeedback(usernameInput, 'Este nome de usuário já está em uso', true);
                                    } else {
                                        showFeedback(usernameInput, 'Nome de usuário disponível', false);
                                    }
                                } else {
                                    // Se não conseguir verificar no backend, considerar disponível
                                    showFeedback(usernameInput, 'Nome de usuário disponível', false);
                                }
                            } catch (error) {
                                // Se falhar a verificação no backend, considerar disponível
                                showFeedback(usernameInput, 'Nome de usuário disponível', false);
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao verificar nome de usuário:', error);
                    }
                }, 500);
            }
        });
    }
    
    // Verificação em tempo real de email já existente
    if (emailInput) {
        let emailCheckTimeout;
        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();
            
            // Verificar formato do email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email.length > 0 && !emailRegex.test(email)) {
                showFeedback(emailInput, 'Formato de e-mail inválido', true);
                return;
            }
            
            // Limpar feedback de formato inválido se o formato estiver correto
            if (email.length > 0 && emailRegex.test(email)) {
                const feedbackElement = emailInput.nextElementSibling.nextElementSibling;
                if (feedbackElement && feedbackElement.textContent.includes('formato')) {
                    feedbackElement.textContent = '';
                    emailInput.style.borderColor = '';
                    emailInput.style.boxShadow = '';
                }
            }
            
            // Verificar disponibilidade do email apenas se tiver formato válido
            if (email.length > 0 && emailRegex.test(email)) {
                // Limpar timeout anterior para evitar múltiplas requisições
                clearTimeout(emailCheckTimeout);
                
                // Adicionar indicador de carregamento
                showFeedback(emailInput, 'Verificando disponibilidade...', false, true);
                
                // Definir novo timeout (delay de 500ms para evitar muitas requisições)
                emailCheckTimeout = setTimeout(async () => {
                    try {
                        // Primeiro verificar no banco de dados local
                        const emailExists = await window.authSystem.checkEmailExists(email);
                        
                        if (emailExists) {
                            showFeedback(emailInput, 'Este e-mail já está cadastrado', true);
                        } else {
                            // Se não existir localmente, verificar disponibilidade no backend
                            try {
                                const response = await fetch(`${window.authSystem.apiUrl}/auth/check-email?email=${encodeURIComponent(email)}`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).catch(() => ({ ok: false }));
                                
                                if (response.ok) {
                                    const data = await response.json();
                                    if (data.exists) {
                                        showFeedback(emailInput, 'Este e-mail já está cadastrado', true);
                                    } else {
                                        showFeedback(emailInput, 'E-mail disponível', false);
                                    }
                                } else {
                                    // Se não conseguir verificar no backend, considerar disponível
                                    showFeedback(emailInput, 'E-mail disponível', false);
                                }
                            } catch (error) {
                                // Se falhar a verificação no backend, considerar disponível
                                showFeedback(emailInput, 'E-mail disponível', false);
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao verificar e-mail:', error);
                    }
                }, 500);
            }
        });
    }
    
    // Envio do formulário de cadastro
    if (signupForm) {
        console.log('Configurando evento de submit no formulário de cadastro');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulário de cadastro enviado');
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            console.log('Dados do formulário:', { name, email, username, password: '****' });
            
            // Limpar mensagens de erro anteriores
            clearAllFeedback();
            
            // Validação básica
            if (!name || !email || !username || !password || !confirmPassword) {
                showFormAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
                console.log('Validação falhou: campos vazios');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showFeedback(emailInput, 'Formato de e-mail inválido', true);
                showFormAlert('O formato do e-mail informado é inválido.', 'error');
                console.log('Validação falhou: formato de e-mail inválido');
                return;
            }
            
            // Validar formato de nome de usuário (sem espaços e caracteres especiais)
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(username)) {
                showFeedback(usernameInput, 'Nome de usuário deve conter apenas letras, números e underscore', true);
                showFormAlert('O nome de usuário deve conter apenas letras, números e underscore.', 'error');
                console.log('Validação falhou: formato de nome de usuário inválido');
                return;
            }
            
            // Validar a senha com requisitos específicos
            const passwordValidation = validatePassword(password);
            if (passwordValidation.strength < 3) {
                let errorMsg = 'A senha não atende aos requisitos de segurança:';
                let fieldMsg = 'A senha não atende aos requisitos mínimos de segurança';
                
                if (!passwordValidation.hasMinLength) errorMsg += ' mínimo de 8 caracteres;';
                if (!passwordValidation.hasMixedCase) errorMsg += ' maiúsculas e minúsculas;';
                if (!passwordValidation.hasNumber) errorMsg += ' pelo menos um número;';
                if (!passwordValidation.hasSpecial) errorMsg += ' pelo menos um caractere especial;';
                
                showFeedback(passwordInput, fieldMsg, true);
                showFormAlert(errorMsg, 'error');
                console.log('Validação falhou: senha não atende requisitos');
                return;
            }
            
            // Verificar se as senhas coincidem
            if (password !== confirmPassword) {
                showFeedback(confirmPasswordInput, 'As senhas não coincidem', true);
                showFormAlert('As senhas informadas não coincidem. Por favor, verifique.', 'error');
                console.log('Validação falhou: senhas não coincidem');
                return;
            }
            
            // Mostrar indicador de carregamento
            signupButton.classList.add('loading');
            document.querySelector('.spinner').style.display = 'inline-block';
            console.log('Mostrado indicador de carregamento');
            
            // Tenta criar a conta localmente primeiro (para evitar problemas com backend offline)
            try {
                console.log('Tentando criar conta no modo local...');
                const result = await window.authSystem.addUser({
                    username: username,
                    password: password,
                    name: name,
                    email: email,
                    role: 'estudante',
                    isActive: true
                });
                
                console.log('Resultado do cadastro local:', result);
                
                if (result) {
                    // Tenta sincronizar com o backend
                    try {
                        console.log('Tentando registrar com o backend...');
                        const response = await fetch(`${window.authSystem.apiUrl}/auth/registro`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                nome: name,
                                email: email,
                                senha: password,
                                role: 'estudante'
                            })
                        });
                        
                        const data = await response.json();
                        console.log('Resposta do backend:', data);
                    } catch (backendError) {
                        // Se falhar com o backend, apenas log (já temos local)
                        console.warn('Falha no registro com o backend, mas cadastro local já foi feito:', backendError);
                    }
                    
                    showFormAlert('Conta criada com sucesso! Redirecionando para o login...', 'success');
                    showNotification('Conta criada com sucesso! Redirecionando para o login...', 'success');
                    
                    // Redirecionar para o login após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'tela-login.html';
                    }, 2000);
                } else {
                    throw new Error('Não foi possível criar a conta no modo local');
                }
            } catch (error) {
                console.error('Erro durante o cadastro:', error);
                hideLoading();
                
                // Tratamento específico para tipos comuns de erro
                if (error.message.includes("já existe")) {
                    showFeedback(usernameInput, 'Este nome de usuário já está em uso', true);
                    showFormAlert('Este nome de usuário já está em uso. Por favor, escolha outro.', 'error');
                } else if (error.message.includes("email")) {
                    showFeedback(emailInput, 'Este e-mail já está em uso', true);
                    showFormAlert('Este e-mail já está em uso. Use outro ou faça login com sua conta existente.', 'error');
                } else {
                    // Mostra o erro específico
                    showFormAlert(error.message || 'Ocorreu um erro durante o cadastro. Tente novamente.', 'error');
                }
                
                // Tentar novamente com o backend
                try {
                    console.log('Tentando registrar apenas com o backend...');
                    const response = await fetch(`${window.authSystem.apiUrl}/auth/registro`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nome: name,
                            email: email,
                            senha: password,
                            role: 'estudante'
                        })
                    });
                    
                    const data = await response.json();
                    console.log('Resposta do backend (tentativa direta):', data);
                    
                    if (data.success) {
                        showFormAlert('Conta criada com sucesso! Redirecionando para o login...', 'success');
                        showNotification('Conta criada com sucesso! Redirecionando para o login...', 'success');
                        
                        // Redirecionar para o login após 2 segundos
                        setTimeout(() => {
                            window.location.href = 'tela-login.html';
                        }, 2000);
                    } else {
                        // Tratamento específico para erros do backend
                        if (data.message.includes("já está em uso")) {
                            if (data.message.includes("email")) {
                                showFeedback(emailInput, 'Este e-mail já está cadastrado', true);
                                showFormAlert('Este e-mail já está cadastrado. Use outro ou faça login com sua conta existente.', 'error');
                            } else {
                                showFeedback(usernameInput, 'Este nome de usuário já está em uso', true);
                                showFormAlert('Este nome de usuário já está em uso. Por favor, escolha outro.', 'error');
                            }
                        } else {
                            throw new Error(data.message || 'Erro no cadastro com o backend');
                        }
                    }
                } catch (backendError) {
                    console.error('Falha completa no cadastro:', backendError);
                    
                    // Exibir mensagem de erro específica baseada no erro
                    let errorMessage = backendError.message || 'Não foi possível criar a conta';
                    
                    // Erros comuns de rede
                    if (errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch")) {
                        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
                    }
                    
                    showFormAlert(errorMessage, 'error');
                    hideLoading();
                }
            }
        });
    } else {
        console.error('Formulário de cadastro não encontrado!');
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
            const result = validatePassword(password);
            updatePasswordStrengthMeter(result.strength);
            
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
            document.querySelector('.password-requirements').style.display = 'block';
        });
        
        passwordInput.addEventListener('blur', () => {
            if (passwordInput.value.length === 0) {
                document.querySelector('.password-strength').classList.remove('visible');
            }
            // Mantém os requisitos visíveis para que o usuário possa vê-los
        });
    }
    
    // Verificar se as senhas coincidem
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (password && confirmPassword) {
                if (password !== confirmPassword) {
                    showFeedback(confirmPasswordInput, 'As senhas não coincidem', true);
                } else {
                    showFeedback(confirmPasswordInput, 'As senhas coincidem', false);
                }
            }
        });
    }
    
    // Alternar tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// Verificar força da senha com critérios específicos
function validatePassword(password) {
    const result = {
        hasMinLength: password.length >= 8,
        hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[^a-zA-Z0-9]/.test(password),
        strength: 0
    };
    
    // Calcular pontuação de força
    if (result.hasMinLength) result.strength += 1;
    if (result.hasMixedCase) result.strength += 1;
    if (result.hasNumber) result.strength += 1;
    if (result.hasSpecial) result.strength += 1;
    
    return result;
}

// Atualizar o medidor de força da senha
function updatePasswordStrengthMeter(strength) {
    const meterBar = document.querySelector('.strength-meter-bar');
    const meterLabel = document.querySelector('.strength-meter-label');
    
    if (!meterBar || !meterLabel) return;
    
    // Remover classes anteriores
    meterBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
    
    // Adicionar a classe apropriada e atualizar largura
    if (strength === 0) {
        meterBar.style.width = '0%';
        meterLabel.textContent = 'Muito fraca';
    } else if (strength === 1) {
        meterBar.classList.add('strength-weak');
        meterBar.style.width = '25%';
        meterLabel.textContent = 'Fraca';
    } else if (strength === 2) {
        meterBar.classList.add('strength-medium');
        meterBar.style.width = '50%';
        meterLabel.textContent = 'Média';
    } else if (strength === 3) {
        meterBar.classList.add('strength-medium');
        meterBar.style.width = '75%';
        meterLabel.textContent = 'Boa';
    } else {
        meterBar.classList.add('strength-strong');
        meterBar.style.width = '100%';
        meterLabel.textContent = 'Forte';
    }
}

// Limpar todas as mensagens de feedback
function clearAllFeedback() {
    const feedbackElements = document.querySelectorAll('.feedback-message');
    const inputElements = document.querySelectorAll('input');
    const alertContainer = document.getElementById('formAlerts');
    
    feedbackElements.forEach(element => {
        element.textContent = '';
    });
    
    inputElements.forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.classList.remove('is-invalid', 'is-valid', 'is-checking');
    });
    
    // Limpar alertas
    if (alertContainer) {
        alertContainer.innerHTML = '';
        alertContainer.style.display = 'none';
    }
}

// Mostrar um alerta geral no formulário
function showFormAlert(message, type = 'error') {
    const alertContainer = document.getElementById('formAlerts');
    if (!alertContainer) return;
    
    // Limpar alertas anteriores do mesmo tipo
    const existingAlerts = alertContainer.querySelectorAll(`.alert.${type}`);
    existingAlerts.forEach(alert => alert.remove());
    
    // Criar novo alerta
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${type}`;
    
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
    
    alertElement.innerHTML = `${icon}<span>${message}</span>`;
    
    // Mostrar o container e adicionar o alerta
    alertContainer.style.display = 'block';
    alertContainer.appendChild(alertElement);
    
    // Animação suave
    setTimeout(() => {
        alertElement.style.opacity = '1';
    }, 10);
    
    // Auto-remover alertas de sucesso após alguns segundos
    if (type === 'success') {
        setTimeout(() => {
            alertElement.style.opacity = '0';
            setTimeout(() => {
                alertElement.remove();
                
                // Esconder o container se não houver mais alertas
                if (alertContainer.children.length === 0) {
                    alertContainer.style.display = 'none';
                }
            }, 300);
        }, 5000);
    }
    
    return alertElement;
}

// Mostrar feedback nos campos
function showFeedback(inputElement, message, isError = false, isChecking = false) {
    const feedbackElement = inputElement.nextElementSibling.nextElementSibling;
    const statusIndicator = inputElement.parentElement.querySelector('.status-indicator');
    
    if (feedbackElement && feedbackElement.classList.contains('feedback-message')) {
        feedbackElement.textContent = message;
        feedbackElement.style.display = message ? 'block' : 'none';
        feedbackElement.style.color = isError ? 'var(--error)' : isChecking ? 'var(--text-secondary)' : 'var(--success)';
        
        // Atualizar indicador de status
        if (statusIndicator) {
            statusIndicator.classList.remove('valid', 'invalid', 'checking');
            
            if (isChecking) {
                statusIndicator.classList.add('checking');
            } else if (message) {
                statusIndicator.classList.add(isError ? 'invalid' : 'valid');
            } else {
                // Se não houver mensagem, remover o indicador
                statusIndicator.classList.remove('valid', 'invalid', 'checking');
            }
        }
        
        // Estilizar o campo de entrada
        inputElement.classList.remove('is-invalid', 'is-valid', 'is-checking');
        
        if (message) {
            if (isError) {
                inputElement.classList.add('is-invalid');
                
                // Destacar o campo com erro apenas se o foco não estiver nele
                if (document.activeElement !== inputElement) {
                    inputElement.focus();
                }
            } else if (!isChecking) {
                inputElement.classList.add('is-valid');
            } else {
                // Estilo neutro durante verificação
                inputElement.classList.add('is-checking');
            }
        }
        
        // Auto-remover mensagens de sucesso após um tempo
        if (message && !isError && !isChecking) {
            setTimeout(() => {
                feedbackElement.textContent = '';
                feedbackElement.style.display = 'none';
                inputElement.classList.remove('is-valid');
                
                if (statusIndicator) {
                    statusIndicator.classList.remove('valid');
                }
            }, 3000);
        }
    }
}

// Ocultar indicadores de carregamento
function hideLoading() {
    const signupButton = document.getElementById('signupBtn');
    if (signupButton) signupButton.classList.remove('loading');
    
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