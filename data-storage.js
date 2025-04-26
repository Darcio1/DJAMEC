/**
 * Sistema de Armazenamento de Dados
 * Módulo responsável por gerenciar o armazenamento e recuperação de dados no cliente
 * Versão 1.0 - Implementação com IndexedDB, localStorage e criptografia básica
 */

// Configuração do sistema de armazenamento
const STORAGE_CONFIG = {
    // IndexedDB
    DB_NAME: 'djamec_storage_db',
    DB_VERSION: 1,
    
    // Stores do IndexedDB
    STORES: {
        USERS: 'users',
        ESTUDANTES: 'estudantes',
        CADEIRAS: 'cadeiras',
        MATERIAIS: 'materiais',
        QUESTIONARIOS: 'questionarios',
        VIDEOS: 'videos',
        CONFIG: 'configuracoes'
    },
    
    // Chaves do Local Storage
    LS_KEYS: {
        SESSION: 'user_session',
        THEME: 'theme',
        AUTH_ATTEMPTS: 'login_attempts',
        LAST_SYNC: 'last_sync_date'
    },
    
    // Segurança
    ENCRYPTION_KEY: 'djamec-secure-storage-key', // Em ambiente real, usar algo mais seguro
    IV_LENGTH: 16, // Tamanho do vetor de inicialização para AES
    
    // Configurações de sincronização (para futuros recursos)
    SYNC_INTERVAL: 30 * 60 * 1000, // 30 minutos em milissegundos
    
    // Tempos de expiração
    SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas em milissegundos
    CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos
};

/**
 * Classe principal de gerenciamento de armazenamento de dados
 */
class DataStorage {
    constructor() {
        // Inicializa estado interno
        this.db = null;
        this.dbReady = false;
        this.dbPromise = null;
        this.useIndexedDB = true;
        
        // Inicializa o banco de dados
        this.dbPromise = this.initDatabase();
    }
    
    /**
     * Inicializa o banco de dados IndexedDB
     * @returns {Promise} - Promessa que resolve quando o banco de dados está pronto
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.error("Seu navegador não suporta IndexedDB. Usando armazenamento alternativo.");
                this.useIndexedDB = false;
                return resolve(false);
            }
            
            const request = indexedDB.open(
                STORAGE_CONFIG.DB_NAME, 
                STORAGE_CONFIG.DB_VERSION
            );
            
            request.onerror = (event) => {
                console.error("Erro ao abrir o banco de dados:", event.target.error);
                this.useIndexedDB = false;
                reject(event.target.error);
            };
            
            request.onupgradeneeded = (event) => {
                console.log(`Atualizando banco de dados para versão ${STORAGE_CONFIG.DB_VERSION}`);
                const db = event.target.result;
                
                // Configurar as stores para cada tipo de dados
                this._createStores(db);
                
                // Migrar dados se necessário
                this._migrateData(event.oldVersion, STORAGE_CONFIG.DB_VERSION, db);
            };
            
            request.onsuccess = (event) => {
                console.log("Banco de dados inicializado com sucesso");
                this.db = event.target.result;
                this.dbReady = true;
                resolve(true);
            };
        });
    }
    
    /**
     * Cria as stores para cada tipo de dados
     * @param {IDBDatabase} db - Instância do banco de dados
     */
    _createStores(db) {
        // Store de usuários
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.USERS)) {
            const usersStore = db.createObjectStore(STORAGE_CONFIG.STORES.USERS, { keyPath: 'username' });
            usersStore.createIndex('email', 'email', { unique: true });
            usersStore.createIndex('role', 'role', { unique: false });
        }
        
        // Store de estudantes
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ESTUDANTES)) {
            const estudantesStore = db.createObjectStore(STORAGE_CONFIG.STORES.ESTUDANTES, { keyPath: 'id' });
            estudantesStore.createIndex('nome', 'nome', { unique: false });
            estudantesStore.createIndex('email', 'email', { unique: true });
            estudantesStore.createIndex('curso', 'curso', { unique: false });
        }
        
        // Store de cadeiras (disciplinas)
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.CADEIRAS)) {
            const cadeirasStore = db.createObjectStore(STORAGE_CONFIG.STORES.CADEIRAS, { keyPath: 'id' });
            cadeirasStore.createIndex('nome', 'nome', { unique: false });
            cadeirasStore.createIndex('professor', 'professor', { unique: false });
        }
        
        // Store de materiais
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.MATERIAIS)) {
            const materiaisStore = db.createObjectStore(STORAGE_CONFIG.STORES.MATERIAIS, { keyPath: 'id' });
            materiaisStore.createIndex('titulo', 'titulo', { unique: false });
            materiaisStore.createIndex('cadeiraId', 'cadeiraId', { unique: false });
        }
        
        // Store de questionários
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.QUESTIONARIOS)) {
            const questionariosStore = db.createObjectStore(STORAGE_CONFIG.STORES.QUESTIONARIOS, { keyPath: 'id' });
            questionariosStore.createIndex('titulo', 'titulo', { unique: false });
            questionariosStore.createIndex('cadeiraId', 'cadeiraId', { unique: false });
        }
        
        // Store de vídeos
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.VIDEOS)) {
            const videosStore = db.createObjectStore(STORAGE_CONFIG.STORES.VIDEOS, { keyPath: 'id' });
            videosStore.createIndex('titulo', 'titulo', { unique: false });
            videosStore.createIndex('cadeiraId', 'cadeiraId', { unique: false });
        }
        
        // Store de configurações
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.CONFIG)) {
            db.createObjectStore(STORAGE_CONFIG.STORES.CONFIG, { keyPath: 'key' });
        }
    }
    
    /**
     * Migra dados entre versões do banco de dados
     * @param {number} oldVersion - Versão antiga
     * @param {number} newVersion - Versão nova
     * @param {IDBDatabase} db - Instância do banco de dados
     */
    _migrateData(oldVersion, newVersion, db) {
        // Para futuras migrações entre versões
        if (oldVersion < 1) {
            console.log("Primeira instalação, nenhuma migração necessária");
        }
        
        // Adicionar futuras migrações aqui:
        // if (oldVersion < 2) { migrarParaVersao2(db); }
        // if (oldVersion < 3) { migrarParaVersao3(db); }
    }
    
    /**
     * Garante que o banco de dados esteja inicializado
     * @returns {Promise<boolean>} - Promessa que resolve quando o banco de dados está pronto
     */
    async ensureDbReady() {
        if (this.dbReady) return true;
        return this.dbPromise;
    }
    
    /**
     * Salva um objeto em uma store específica
     * @param {string} storeName - Nome da store
     * @param {Object} data - Dados a serem salvos
     * @param {boolean} encrypt - Indica se os dados sensíveis devem ser criptografados
     * @returns {Promise<any>} - Promessa que resolve com o resultado da operação
     */
    async saveData(storeName, data, encrypt = false) {
        // Garante que o banco de dados está pronto
        await this.ensureDbReady();
        
        // Cria uma cópia do objeto para não modificar o original
        const objToSave = { ...data };
        
        // Adiciona campos de metadados
        objToSave.updatedAt = new Date().toISOString();
        if (!objToSave.createdAt) {
            objToSave.createdAt = objToSave.updatedAt;
        }
        
        // Criptografa dados sensíveis se necessário
        if (encrypt) {
            this._encryptSensitiveData(objToSave);
        }
        
        return new Promise((resolve, reject) => {
            if (!this.useIndexedDB || !this.db) {
                // Fallback para localStorage
                try {
                    const key = `${storeName}_${objToSave.id || objToSave.username || objToSave.key}`;
                    localStorage.setItem(key, JSON.stringify(objToSave));
                    resolve(objToSave);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(objToSave);
                
                request.onsuccess = () => resolve(objToSave);
                request.onerror = (event) => {
                    console.error(`Erro ao salvar no ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Erro ao iniciar transação para ${storeName}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Obtém um objeto de uma store específica
     * @param {string} storeName - Nome da store
     * @param {string|number} id - Identificador do objeto
     * @param {boolean} decrypt - Indica se os dados sensíveis devem ser descriptografados
     * @returns {Promise<any>} - Promessa que resolve com o objeto encontrado ou null
     */
    async getData(storeName, id, decrypt = false) {
        // Garante que o banco de dados está pronto
        await this.ensureDbReady();
        
        return new Promise((resolve, reject) => {
            if (!this.useIndexedDB || !this.db) {
                // Fallback para localStorage
                try {
                    const key = `${storeName}_${id}`;
                    const data = localStorage.getItem(key);
                    if (!data) return resolve(null);
                    
                    const parsedData = JSON.parse(data);
                    if (decrypt) {
                        this._decryptSensitiveData(parsedData);
                    }
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result && decrypt) {
                        this._decryptSensitiveData(result);
                    }
                    resolve(result || null);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao buscar no ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Erro ao iniciar transação para ${storeName}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Busca vários objetos de uma store com base em um critério
     * @param {string} storeName - Nome da store
     * @param {string} indexName - Nome do índice para busca
     * @param {any} indexValue - Valor do índice para filtragem
     * @param {boolean} decrypt - Indica se os dados sensíveis devem ser descriptografados
     * @returns {Promise<Array>} - Promessa que resolve com um array de objetos
     */
    async queryData(storeName, indexName, indexValue, decrypt = false) {
        // Garante que o banco de dados está pronto
        await this.ensureDbReady();
        
        return new Promise((resolve, reject) => {
            if (!this.useIndexedDB || !this.db) {
                // Implementação básica de fallback para localStorage
                // Não é eficiente, mas serve como backup
                try {
                    const results = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key.startsWith(`${storeName}_`)) {
                            try {
                                const data = JSON.parse(localStorage.getItem(key));
                                if (data[indexName] === indexValue) {
                                    if (decrypt) {
                                        this._decryptSensitiveData(data);
                                    }
                                    results.push(data);
                                }
                            } catch (e) {
                                console.warn(`Erro ao processar item ${key} do localStorage:`, e);
                            }
                        }
                    }
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(indexValue);
                
                request.onsuccess = () => {
                    const results = request.result || [];
                    if (decrypt) {
                        results.forEach(item => this._decryptSensitiveData(item));
                    }
                    resolve(results);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao consultar no ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Erro ao iniciar transação para ${storeName}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Obtém todos os objetos de uma store
     * @param {string} storeName - Nome da store
     * @param {boolean} decrypt - Indica se os dados sensíveis devem ser descriptografados
     * @returns {Promise<Array>} - Promessa que resolve com um array de objetos
     */
    async getAllData(storeName, decrypt = false) {
        // Garante que o banco de dados está pronto
        await this.ensureDbReady();
        
        return new Promise((resolve, reject) => {
            if (!this.useIndexedDB || !this.db) {
                // Implementação básica de fallback para localStorage
                try {
                    const results = [];
                    const prefix = `${storeName}_`;
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key.startsWith(prefix)) {
                            try {
                                const data = JSON.parse(localStorage.getItem(key));
                                if (decrypt) {
                                    this._decryptSensitiveData(data);
                                }
                                results.push(data);
                            } catch (e) {
                                console.warn(`Erro ao processar item ${key} do localStorage:`, e);
                            }
                        }
                    }
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const results = request.result || [];
                    if (decrypt) {
                        results.forEach(item => this._decryptSensitiveData(item));
                    }
                    resolve(results);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao obter todos os dados do ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Erro ao iniciar transação para ${storeName}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Remove um objeto de uma store
     * @param {string} storeName - Nome da store
     * @param {string|number} id - Identificador do objeto a remover
     * @returns {Promise<boolean>} - Promessa que resolve com true se removido com sucesso
     */
    async deleteData(storeName, id) {
        // Garante que o banco de dados está pronto
        await this.ensureDbReady();
        
        return new Promise((resolve, reject) => {
            if (!this.useIndexedDB || !this.db) {
                // Fallback para localStorage
                try {
                    const key = `${storeName}_${id}`;
                    localStorage.removeItem(key);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve(true);
                request.onerror = (event) => {
                    console.error(`Erro ao remover do ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Erro ao iniciar transação para ${storeName}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Limpa todos os dados de uma store
     * @param {string} storeName - Nome da store
     * @returns {Promise<boolean>} - Promessa que resolve com true se a operação for bem-sucedida
     */
    async clearStore(storeName) {
        // Garante que o banco de dados está pronto
        await this.ensureDbReady();
        
        return new Promise((resolve, reject) => {
            if (!this.useIndexedDB || !this.db) {
                // Fallback para localStorage
                try {
                    const keysToRemove = [];
                    const prefix = `${storeName}_`;
                    
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key.startsWith(prefix)) {
                            keysToRemove.push(key);
                        }
                    }
                    
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => resolve(true);
                request.onerror = (event) => {
                    console.error(`Erro ao limpar ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Erro ao iniciar transação para ${storeName}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Gera um ID aleatório único
     * @returns {string} - ID gerado
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    
    /**
     * Criptografa dados sensíveis de um objeto
     * @param {Object} data - Objeto com dados a serem criptografados
     * @private
     */
    _encryptSensitiveData(data) {
        // Campos que devem ser criptografados
        const sensitiveFiedls = ['password', 'cpf', 'rg', 'telefone'];
        
        // Implementação básica de criptografia (para demonstração)
        // Em um sistema real, usar uma biblioteca de criptografia adequada
        for (const field of sensitiveFiedls) {
            if (data[field] && typeof data[field] === 'string') {
                // Marca o campo como criptografado e aplica uma codificação simples
                // Em produção, usar algo como AES com chave segura
                data[field] = {
                    encrypted: true,
                    value: btoa(data[field]) // Base64 (apenas para demonstração)
                };
            }
        }
    }
    
    /**
     * Descriptografa dados sensíveis de um objeto
     * @param {Object} data - Objeto com dados a serem descriptografados
     * @private
     */
    _decryptSensitiveData(data) {
        // Campos que podem estar criptografados
        const sensitiveFiedls = ['password', 'cpf', 'rg', 'telefone'];
        
        // Descriptografa campos marcados
        for (const field of sensitiveFiedls) {
            if (data[field] && data[field].encrypted) {
                try {
                    // Descriptografa valor
                    // Em produção, usar algo como AES com chave segura
                    data[field] = atob(data[field].value); // Base64 decode (apenas para demonstração)
                } catch (error) {
                    console.error(`Erro ao descriptografar campo ${field}:`, error);
                    data[field] = ''; // Limpa o valor em caso de erro
                }
            }
        }
    }
    
    /**
     * Salva uma configuração global
     * @param {string} key - Chave da configuração
     * @param {any} value - Valor da configuração
     * @returns {Promise<boolean>} - Promessa que resolve com true se salva com sucesso
     */
    async saveConfig(key, value) {
        return this.saveData(STORAGE_CONFIG.STORES.CONFIG, {
            key,
            value,
            updatedAt: new Date().toISOString()
        });
    }
    
    /**
     * Obtém uma configuração global
     * @param {string} key - Chave da configuração
     * @returns {Promise<any>} - Promessa que resolve com o valor da configuração ou null
     */
    async getConfig(key) {
        const config = await this.getData(STORAGE_CONFIG.STORES.CONFIG, key);
        return config ? config.value : null;
    }
    
    /**
     * Salva dados da sessão do usuário
     * @param {Object} sessionData - Dados da sessão
     * @param {boolean} rememberMe - Se deve manter a sessão ativa após fechar o navegador
     */
    saveSession(sessionData, rememberMe = true) {
        // Cria um objeto de sessão com metadados
        const session = {
            ...sessionData,
            expiresAt: new Date(Date.now() + STORAGE_CONFIG.SESSION_EXPIRY).toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // Salva na sessionStorage (sempre, pois é válido apenas para a sessão atual)
        sessionStorage.setItem('is_authenticated', 'true');
        
        // Se "Lembrar-me" estiver marcado, salva no localStorage para persistência
        if (rememberMe) {
            localStorage.setItem(STORAGE_CONFIG.LS_KEYS.SESSION, JSON.stringify(session));
        } else {
            // Limpa localStorage se não for para lembrar
            localStorage.removeItem(STORAGE_CONFIG.LS_KEYS.SESSION);
        }
        
        // Define cookie de autenticação
        const expiryDate = new Date(session.expiresAt);
        document.cookie = `user_authenticated=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
        
        return true;
    }
    
    /**
     * Obtém dados da sessão atual do usuário
     * @returns {Object|null} - Dados da sessão ou null se não estiver autenticado
     */
    getSession() {
        const localData = localStorage.getItem(STORAGE_CONFIG.LS_KEYS.SESSION);
        
        if (localData) {
            try {
                const session = JSON.parse(localData);
                
                // Verifica se a sessão expirou
                const expiresAt = new Date(session.expiresAt).getTime();
                if (expiresAt > Date.now()) {
                    return session;
                } else {
                    // Se expirou, limpa a sessão
                    this.clearSession();
                }
            } catch (error) {
                console.error("Erro ao obter dados da sessão:", error);
                this.clearSession();
            }
        }
        
        return null;
    }
    
    /**
     * Limpa a sessão atual e todos os dados de autenticação
     */
    clearSession() {
        localStorage.removeItem(STORAGE_CONFIG.LS_KEYS.SESSION);
        sessionStorage.removeItem('is_authenticated');
        document.cookie = `user_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
    }
    
    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean} - Verdadeiro se estiver autenticado
     */
    isAuthenticated() {
        // Verifica primeiro na sessionStorage (mais rápido)
        if (sessionStorage.getItem('is_authenticated') === 'true') {
            return true;
        }
        
        // Verifica no localStorage
        const session = this.getSession();
        if (session) {
            return true;
        }
        
        // Verifica no cookie
        return document.cookie.includes('user_authenticated=true');
    }
}

// Cria e exporta a instância única do sistema de armazenamento
const dataStorage = new DataStorage(); 