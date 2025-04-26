/**
 * Sistema de Autenticação
 * Módulo responsável por gerenciar autenticação de usuários
 * Versão 2.0 - Com IndexedDB para armazenamento local
 */

// Configuração do sistema
const AUTH_CONFIG = {
    // Chave para armazenamento dos dados no localStorage
    STORAGE_KEY: 'user_session',
    // Nome do cookie de autenticação
    AUTH_COOKIE: 'user_authenticated',
    // Tempo de validade da sessão em dias
    SESSION_EXPIRY_DAYS: 1,
    // URL da página de login
    LOGIN_PAGE: 'tela-login.html',
    // URL da página após login bem-sucedido
    DASHBOARD_PAGE: 'dashboard-admin.html',
    // Tempo de bloqueio após tentativas falhas (em minutos)
    LOCKOUT_TIME: 5,
    // Número máximo de tentativas antes do bloqueio
    MAX_ATTEMPTS: 3,
    // Nome do banco de dados IndexedDB
    DB_NAME: 'djamec_auth_db',
    // Versão do banco de dados
    DB_VERSION: 1,
    // Nome da store de usuários
    USERS_STORE: 'users',
    // URL base da API
    API_URL: 'http://localhost:3000/api'
};

// Base de usuários (simulando dados iniciais)
// Em um sistema real, isso seria armazenado em um banco de dados no servidor
const INITIAL_USERS = [
    {
        username: "admin",
        password: "admin123",
        role: "Administrador",
        name: "Administrador DJAMEC",
        email: "admin@djamec.com",
        profileImg: null,
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        username: "Darciocalei",
        password: "Darcio2004@",
        role: "Administrador",
        name: "Darcio Calei",
        email: "darciocalei@gmail.com",
        profileImg: null,
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        username: "Paulosoba",
        password: "Darcio2004@",
        role: "Administrador",
        name: "Paulo Sousa",
        email: "paulosousa@gmail.com",
        profileImg: null,
        isActive: true,
        createdAt: new Date().toISOString()
    }
];

// Classe principal de autenticação
class AuthSystem {
    constructor() {
        this.storageKey = AUTH_CONFIG.STORAGE_KEY;
        this.authCookie = AUTH_CONFIG.AUTH_COOKIE;
        this.loginPage = AUTH_CONFIG.LOGIN_PAGE;
        this.dashboardPage = AUTH_CONFIG.DASHBOARD_PAGE;
        this.sessionExpiryDays = AUTH_CONFIG.SESSION_EXPIRY_DAYS;
        this.maxAttempts = AUTH_CONFIG.MAX_ATTEMPTS;
        this.lockoutTime = AUTH_CONFIG.LOCKOUT_TIME;
        this.apiUrl = AUTH_CONFIG.API_URL;
        
        // Registra tentativas de login
        this.loginAttempts = this.getLoginAttempts();
        
        // Inicializa o banco de dados
        this.dbReady = this.initDatabase();
    }
    
    /**
     * Inicializa o banco de dados IndexedDB
     * @returns {Promise} - Promessa que resolve quando o banco de dados está pronto
     */
    async initDatabase() {
        console.log('Iniciando banco de dados IndexedDB');
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.error("Seu navegador não suporta IndexedDB. Usando armazenamento de fallback.");
                this.useIndexedDB = false;
                return resolve(false);
            }
            
            this.useIndexedDB = true;
            console.log(`Abrindo banco de dados: ${AUTH_CONFIG.DB_NAME}, versão ${AUTH_CONFIG.DB_VERSION}`);
            let request;
            
            try {
                request = indexedDB.open(AUTH_CONFIG.DB_NAME, AUTH_CONFIG.DB_VERSION);
            } catch (error) {
                console.error("Erro ao tentar abrir o banco de dados:", error);
                this.useIndexedDB = false;
                return resolve(false);
            }
            
            request.onerror = (event) => {
                console.error("Erro ao abrir o banco de dados:", event.target.error);
                this.useIndexedDB = false;
                resolve(false); // Não rejeitamos para permitir fallback
            };
            
            request.onupgradeneeded = (event) => {
                console.log("Executando onupgradeneeded - criando estrutura do banco");
                const db = event.target.result;
                
                // Cria a store de usuários se não existir
                if (!db.objectStoreNames.contains(AUTH_CONFIG.USERS_STORE)) {
                    console.log(`Criando object store: ${AUTH_CONFIG.USERS_STORE}`);
                    const usersStore = db.createObjectStore(AUTH_CONFIG.USERS_STORE, { keyPath: 'username' });
                    
                    // Cria índices para busca rápida
                    usersStore.createIndex('email', 'email', { unique: true });
                    usersStore.createIndex('role', 'role', { unique: false });
                    
                    console.log("Store de usuários criada com sucesso!");
                } else {
                    console.log("Object store já existe, não é necessário criar");
                }
            };
            
            request.onsuccess = async (event) => {
                console.log("Banco de dados aberto com sucesso!");
                try {
                    this.db = event.target.result;
                    
                    // Monitorar eventos de conexão
                    this.db.onversionchange = () => {
                        console.log("Versão do banco alterada em outra aba");
                        this.db.close();
                    };
                    
                    this.db.onerror = (event) => {
                        console.error("Erro no banco de dados:", event.target.error);
                    };
                    
                    // Verifica se existem usuários e adiciona os iniciais se não houver
                    const usersCount = await this.getUsersCount();
                    console.log(`Contagem de usuários no banco: ${usersCount}`);
                    
                    if (usersCount === 0) {
                        console.log("Inicializando banco de dados com usuários padrão...");
                        await this.addInitialUsers();
                    }
                    
                    resolve(true);
                } catch (error) {
                    console.error("Erro ao configurar banco de dados:", error);
                    this.useIndexedDB = false;
                    resolve(false);
                }
            };
        });
    }
    
    /**
     * Conta quantos usuários existem no banco de dados
     * @returns {Promise<number>} - Promessa que resolve com o número de usuários
     */
    getUsersCount() {
        return new Promise((resolve, reject) => {
            if (!this.db || !this.useIndexedDB) {
                return resolve(INITIAL_USERS.length);
            }
            
            const transaction = this.db.transaction([AUTH_CONFIG.USERS_STORE], 'readonly');
            const store = transaction.objectStore(AUTH_CONFIG.USERS_STORE);
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
                resolve(countRequest.result);
            };
            
            countRequest.onerror = (event) => {
                console.error("Erro ao contar usuários:", event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    /**
     * Adiciona os usuários iniciais ao banco de dados
     * @returns {Promise<boolean>} - Promessa que resolve quando todos os usuários são adicionados
     */
    async addInitialUsers() {
        if (!this.db || !this.useIndexedDB) {
            console.warn("IndexedDB não disponível. Usando dados de fallback.");
            return false;
        }
        
        const transaction = this.db.transaction([AUTH_CONFIG.USERS_STORE], 'readwrite');
        const store = transaction.objectStore(AUTH_CONFIG.USERS_STORE);
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log("Usuários iniciais adicionados com sucesso!");
                resolve(true);
            };
            
            transaction.onerror = (event) => {
                console.error("Erro ao adicionar usuários iniciais:", event.target.error);
                reject(event.target.error);
            };
            
            // Adiciona cada usuário ao banco de dados
            INITIAL_USERS.forEach(user => {
                store.add(user);
            });
        });
    }
    
    /**
     * Busca um usuário pelo nome de usuário
     * @param {string} username - Nome de usuário
     * @returns {Promise<Object|null>} - Promessa que resolve com o usuário ou null se não encontrado
     */
    getUser(username) {
        return new Promise((resolve, reject) => {
            console.log('Buscando usuário:', username);
            if (!this.useIndexedDB || !this.db) {
                // Fallback para array em memória se IndexedDB não estiver disponível
                console.log('Usando fallback em memória para buscar usuário');
                const user = INITIAL_USERS.find(u => u.username === username);
                console.log('Resultado da busca (memória):', user ? 'Encontrado' : 'Não encontrado');
                return resolve(user || null);
            }
            
            try {
                console.log('Buscando usuário no IndexedDB');
                const transaction = this.db.transaction([AUTH_CONFIG.USERS_STORE], 'readonly');
                const store = transaction.objectStore(AUTH_CONFIG.USERS_STORE);
                const request = store.get(username);
                
                request.onsuccess = () => {
                    console.log('Resultado da busca (IndexedDB):', request.result ? 'Encontrado' : 'Não encontrado');
                    resolve(request.result || null);
                };
                
                request.onerror = (event) => {
                    console.error("Erro ao buscar usuário:", event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error("Erro geral ao buscar usuário:", error);
                reject(error);
            }
        });
    }
    
    /**
     * Adiciona um novo usuário ao banco de dados
     * @param {Object} userData - Dados do usuário
     * @returns {Promise<boolean>} - Promessa que resolve com true se o usuário foi adicionado
     */
    addUser(userData) {
        return new Promise(async (resolve, reject) => {
            console.log('Iniciando adição de usuário:', userData.username);
            // Valida dados básicos do usuário
            if (!userData.username || !userData.password || !userData.email) {
                console.error('Dados de usuário incompletos');
                return reject(new Error("Dados de usuário incompletos"));
            }
            
            try {
                // Verifica se o usuário já existe
                console.log('Verificando se usuário já existe:', userData.username);
                const existingUser = await this.getUser(userData.username).catch(() => null);
                if (existingUser) {
                    console.error('Usuário já existe:', userData.username);
                    return reject(new Error("Usuário já existe"));
                }
                
                // Prepara dados do usuário com valores padrão para campos faltantes
                const userToAdd = {
                    ...userData,
                    role: userData.role || "Usuário",
                    isActive: userData.isActive !== undefined ? userData.isActive : true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                };
                
                if (!this.useIndexedDB || !this.db) {
                    // Fallback para array em memória
                    console.log('Usando fallback em memória para adicionar usuário');
                    INITIAL_USERS.push(userToAdd);
                    console.log('Usuário adicionado com sucesso (modo memória):', userData.username);
                    return resolve(true);
                }
                
                console.log('Adicionando usuário ao IndexedDB:', userData.username);
                const transaction = this.db.transaction([AUTH_CONFIG.USERS_STORE], 'readwrite');
                const store = transaction.objectStore(AUTH_CONFIG.USERS_STORE);
                const request = store.add(userToAdd);
                
                request.onsuccess = () => {
                    console.log('Usuário adicionado com sucesso (IndexedDB):', userData.username);
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error("Erro ao adicionar usuário no IndexedDB:", event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error("Erro geral ao adicionar usuário:", error);
                reject(error);
            }
        });
    }
    
    /**
     * Atualiza os dados de um usuário existente
     * @param {string} username - Nome de usuário
     * @param {Object} userData - Novos dados do usuário
     * @returns {Promise<boolean>} - Promessa que resolve com true se o usuário foi atualizado
     */
    updateUser(username, userData) {
        return new Promise(async (resolve, reject) => {
            // Busca o usuário existente
            const existingUser = await this.getUser(username).catch(() => null);
            if (!existingUser) {
                return reject(new Error("Usuário não encontrado"));
            }
            
            // Mescla os dados existentes com os novos
            const updatedUser = {
                ...existingUser,
                ...userData,
                username: existingUser.username // Mantém o username original como chave
            };
            
            if (!this.useIndexedDB || !this.db) {
                // Fallback para array em memória
                const index = INITIAL_USERS.findIndex(u => u.username === username);
                if (index !== -1) {
                    INITIAL_USERS[index] = updatedUser;
                    return resolve(true);
                }
                return reject(new Error("Usuário não encontrado no array de fallback"));
            }
            
            const transaction = this.db.transaction([AUTH_CONFIG.USERS_STORE], 'readwrite');
            const store = transaction.objectStore(AUTH_CONFIG.USERS_STORE);
            const request = store.put(updatedUser);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error("Erro ao atualizar usuário:", event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    /**
     * Autentica um usuário com nome de usuário e senha
     * @param {string} username - Nome de usuário ou email
     * @param {string} password - Senha do usuário
     * @param {boolean} rememberMe - Se deve lembrar o usuário após fechar o navegador
     * @returns {Promise<Object>} - Promessa que resolve com o resultado da autenticação
     */
    async authenticate(username, password, rememberMe = true) {
        try {
            console.log('Iniciando autenticação para:', username);
            // Verificar se é um email ou username
            const isEmail = username.includes('@');
            
            // Tenta autenticar com o backend primeiro
            try {
                console.log('Tentando autenticar com backend...');
                const response = await fetch(`${this.apiUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: isEmail ? username : `${username}@djamec.com`,
                        senha: password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Autenticação backend bem-sucedida
                    console.log('Autenticação backend bem-sucedida');
                    
                    // Limpar tentativas de login
                    this.clearFailedAttempts(username);
                    
                    // Salvar sessão
                    const sessionData = {
                        id: data.usuario.id,
                        username: isEmail ? data.usuario.email.split('@')[0] : username,
                        name: data.usuario.nome,
                        email: data.usuario.email,
                        role: data.usuario.role,
                        token: data.token,
                        isActive: true,
                        lastLogin: new Date().toISOString()
                    };
                    
                    this.saveSession(sessionData, rememberMe);
                    
                    return {
                        success: true,
                        message: 'Login realizado com sucesso!',
                        user: sessionData
                    };
                } else {
                    throw new Error(data.message || 'Falha na autenticação com o backend');
                }
            } catch (backendError) {
                console.warn('Falha na autenticação com o backend, recorrendo ao modo local:', backendError);
                
                // Verificar se a conta está bloqueada
                if (this.isAccountLocked(username)) {
                    const remainingTime = this.getRemainingLockoutTime(username);
                    return {
                        success: false,
                        message: `Conta bloqueada. Tente novamente em ${remainingTime} minutos.`
                    };
                }
                
                // Se o backend falhar, tenta autenticar com o banco local
                console.log('Tentando autenticação local para:', username);
                const user = await this.getUser(username).catch(() => null);
                
                if (!user) {
                    this.registerFailedAttempt(username);
                    return {
                        success: false,
                        message: 'Usuário não encontrado.'
                    };
                }
                
                if (!user.isActive) {
                    return {
                        success: false,
                        message: 'Conta desativada. Entre em contato com o administrador.'
                    };
                }
                
                // Verifica senha (simples, já que não estamos usando hash no exemplo básico)
                if (user.password !== password) {
                    this.registerFailedAttempt(username);
                    return {
                        success: false,
                        message: 'Senha incorreta.'
                    };
                }
                
                // Limpar tentativas de login
                this.clearFailedAttempts(username);
                
                // Criar dados da sessão
                const sessionData = {
                    id: user.id || user._id || username,
                    username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    lastLogin: new Date().toISOString()
                };
                
                // Salvar sessão
                this.saveSession(sessionData, rememberMe);
                
                return {
                    success: true,
                    message: 'Login realizado com sucesso! (Modo local)',
                    user: sessionData
                };
            }
        } catch (error) {
            console.error('Erro durante autenticação:', error);
            return {
                success: false,
                message: 'Erro ao processar autenticação: ' + error.message
            };
        }
    }
    
    /**
     * Salva os dados da sessão nos locais de armazenamento
     * @param {Object} sessionData - Dados da sessão
     * @param {boolean} rememberMe - Se deve persistir a sessão em armazenamento de longo prazo
     */
    saveSession(sessionData, rememberMe) {
        // Sempre salva na sessionStorage para a sessão atual
        sessionStorage.setItem('is_authenticated', 'true');
        
        // Se "Lembrar-me" estiver marcado, salva no localStorage para persistência
        if (rememberMe) {
            localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
        } else {
            // Garante que não haja dados antigos no localStorage
            localStorage.removeItem(this.storageKey);
        }
        
        // Define o cookie com data de expiração
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.sessionExpiryDays);
        document.cookie = `${this.authCookie}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    }
    
    /**
     * Encerra a sessão do usuário e limpa todos os dados de autenticação
     */
    logout() {
        // Limpa localStorage e sessionStorage
        localStorage.removeItem(this.storageKey);
        sessionStorage.clear();
        
        // Remove o cookie de autenticação
        document.cookie = `${this.authCookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
        
        // Redireciona para a página de login
        window.location.href = this.loginPage;
    }
    
    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean} - Verdadeiro se estiver autenticado
     */
    isAuthenticated() {
        const hasLocalStorage = !!localStorage.getItem(this.storageKey);
        const hasSessionStorage = sessionStorage.getItem('is_authenticated') === 'true';
        const hasCookie = document.cookie.includes(`${this.authCookie}=true`);
        
        return hasLocalStorage || hasSessionStorage || hasCookie;
    }
    
    /**
     * Redireciona para a página de login se não estiver autenticado
     * @returns {boolean} - Verdadeiro se estiver autenticado
     */
    checkAuthentication() {
        if (!this.isAuthenticated()) {
            window.location.href = this.loginPage;
            return false;
        }
        return true;
    }
    
    /**
     * Obtém os dados da sessão atual do usuário
     * @returns {Object|null} - Dados da sessão ou null se não estiver autenticado
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }
        
        try {
            // Tenta obter os dados do localStorage primeiro
            const userData = localStorage.getItem(this.storageKey);
            if (userData) {
                return JSON.parse(userData);
            }
            
            // Se não encontrar no localStorage, retorna um objeto básico
            return {
                isLoggedIn: true,
                username: "usuário"
            };
        } catch (error) {
            console.error("Erro ao obter usuário atual:", error);
            return null;
        }
    }
    
    /**
     * Registra uma tentativa falha de login
     * @param {string} username - Nome de usuário que falhou
     */
    registerFailedAttempt(username) {
        let attempts = this.loginAttempts;
        
        if (!attempts[username]) {
            attempts[username] = {
                count: 0,
                timestamp: new Date().getTime()
            };
        }
        
        attempts[username].count += 1;
        attempts[username].timestamp = new Date().getTime();
        
        // Salva as tentativas atualizadas
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
    }
    
    /**
     * Limpa as tentativas falhas de um usuário
     * @param {string} username - Nome de usuário
     */
    clearFailedAttempts(username) {
        let attempts = this.loginAttempts;
        
        if (attempts[username]) {
            delete attempts[username];
            localStorage.setItem('login_attempts', JSON.stringify(attempts));
        }
    }
    
    /**
     * Verifica se a conta do usuário está bloqueada
     * @param {string} username - Nome de usuário
     * @returns {boolean} - Verdadeiro se a conta estiver bloqueada
     */
    isAccountLocked(username) {
        const attempts = this.loginAttempts;
        
        if (!attempts[username] || attempts[username].count < this.maxAttempts) {
            return false;
        }
        
        const lockTimestamp = attempts[username].timestamp;
        const lockDuration = this.lockoutTime * 60 * 1000; // Convertido para milissegundos
        const currentTime = new Date().getTime();
        
        // Verifica se o período de bloqueio ainda está ativo
        if (currentTime - lockTimestamp < lockDuration) {
            return true;
        }
        
        // Se o período de bloqueio terminou, limpa as tentativas
        this.clearFailedAttempts(username);
        return false;
    }
    
    /**
     * Obtém o tempo restante de bloqueio em minutos
     * @param {string} username - Nome de usuário
     * @returns {number} - Minutos restantes de bloqueio
     */
    getRemainingLockoutTime(username) {
        const attempts = this.loginAttempts;
        
        if (!attempts[username]) {
            return 0;
        }
        
        const lockTimestamp = attempts[username].timestamp;
        const lockDuration = this.lockoutTime * 60 * 1000; // Convertido para milissegundos
        const currentTime = new Date().getTime();
        const timeElapsed = currentTime - lockTimestamp;
        
        if (timeElapsed >= lockDuration) {
            return 0;
        }
        
        return Math.ceil((lockDuration - timeElapsed) / (60 * 1000));
    }
    
    /**
     * Obtém as tentativas de login do localStorage
     * @returns {Object} - Objeto com as tentativas de login
     */
    getLoginAttempts() {
        try {
            const attempts = localStorage.getItem('login_attempts');
            return attempts ? JSON.parse(attempts) : {};
        } catch (error) {
            console.error("Erro ao obter tentativas de login:", error);
            return {};
        }
    }

    /**
     * Verifica se um nome de usuário já existe
     * @param {string} username - Nome de usuário para verificar
     * @returns {Promise<boolean>} - Promessa que resolve com true se o usuário existir
     */
    async checkUserExists(username) {
        console.log('Verificando se usuário existe:', username);
        try {
            const user = await this.getUser(username);
            return !!user;
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            return false;
        }
    }

    /**
     * Verifica se um email já está em uso
     * @param {string} email - Email para verificar
     * @returns {Promise<boolean>} - Promessa que resolve com true se o email existir
     */
    async checkEmailExists(email) {
        console.log('Verificando se email existe:', email);
        
        if (!this.useIndexedDB || !this.db) {
            // Modo fallback para memória
            return INITIAL_USERS.some(user => user.email === email);
        }
        
        // Verificar usando índice de email no IndexedDB
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([AUTH_CONFIG.USERS_STORE], 'readonly');
                const store = transaction.objectStore(AUTH_CONFIG.USERS_STORE);
                
                // Usar o índice de email
                const emailIndex = store.index('email');
                const request = emailIndex.get(email);
                
                request.onsuccess = (event) => {
                    resolve(!!event.target.result);
                };
                
                request.onerror = (event) => {
                    console.error('Erro ao buscar email:', event.target.error);
                    resolve(false);
                };
            } catch (error) {
                console.error('Erro ao verificar email:', error);
                resolve(false);
            }
        });
    }
}

// Cria a instância do sistema de autenticação
const authSystem = new AuthSystem();

// Para páginas que precisam de autenticação, adiciona verificação ao carregar
if (window.location.pathname.indexOf('login') === -1 && window.location.pathname.indexOf('signup') === -1) {
    document.addEventListener('DOMContentLoaded', function() {
        authSystem.checkAuthentication();
    });
} 