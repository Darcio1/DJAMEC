/**
 * Script de Migração de Dados
 * Responsável por migrar dados do sistema antigo para o novo sistema de armazenamento
 * Deve ser executado uma única vez durante a transição
 */

// Classe de migração
class DataMigrator {
    constructor() {
        // Referências para os sistemas
        this.oldAuthSystem = null;
        this.dataStorage = null;
        
        // Mapeamento entre stores antigas e novas
        this.storeMapping = {
            'users': 'users',
            'estudantes': 'estudantes',
            'cadeiras': 'cadeiras',
            'materiais': 'materiais',
            'questionarios': 'questionarios',
            'videos': 'videos'
        };
        
        // Status da migração
        this.migrationStatus = {
            started: false,
            completed: false,
            error: null,
            messages: []
        };
    }
    
    /**
     * Inicializa o migrador
     * @returns {Promise<boolean>} - Promessa que resolve com true se inicializado com sucesso
     */
    async init() {
        // Verifica se o migrador já foi executado
        if (localStorage.getItem('data_migration_completed') === 'true') {
            console.log("A migração já foi concluída anteriormente.");
            this.migrationStatus.completed = true;
            this.migrationStatus.messages.push("A migração já foi concluída anteriormente.");
            return true;
        }
        
        try {
            // Verifica se os sistemas necessários estão disponíveis
            if (!window.authSystem) {
                throw new Error("Sistema de autenticação antigo não encontrado.");
            }
            
            if (!window.dataStorage) {
                throw new Error("Sistema de armazenamento novo não encontrado.");
            }
            
            this.oldAuthSystem = window.authSystem;
            this.dataStorage = window.dataStorage;
            
            // Aguarda a inicialização dos sistemas
            await this.dataStorage.ensureDbReady();
            
            console.log("Migrador de dados inicializado com sucesso.");
            return true;
        } catch (error) {
            console.error("Erro ao inicializar migrador:", error);
            this.migrationStatus.error = error.message;
            this.migrationStatus.messages.push(`Erro na inicialização: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Inicia o processo de migração
     * @returns {Promise<boolean>} - Promessa que resolve com true se a migração for bem-sucedida
     */
    async migrate() {
        // Evita iniciar a migração mais de uma vez
        if (this.migrationStatus.started) {
            console.warn("A migração já foi iniciada.");
            return false;
        }
        
        // Marca a migração como iniciada
        this.migrationStatus.started = true;
        this.migrationStatus.messages.push("Iniciando processo de migração...");
        
        try {
            // 1. Migrar usuários
            await this.migrateUsers();
            this.migrationStatus.messages.push("Usuários migrados com sucesso.");
            
            // 2. Migrar configuração de tema
            await this.migrateThemeConfig();
            this.migrationStatus.messages.push("Configurações de tema migradas com sucesso.");
            
            // 3. Migrar tentativas de login
            await this.migrateLoginAttempts();
            this.migrationStatus.messages.push("Tentativas de login migradas com sucesso.");
            
            // 4. Migrar dados da sessão atual (se houver)
            await this.migrateSessionData();
            this.migrationStatus.messages.push("Dados de sessão migrados com sucesso.");
            
            // 5. Migrar dados de localStorage (localStorage keys)
            await this.migrateLocalStorageData();
            this.migrationStatus.messages.push("Dados do localStorage migrados com sucesso.");
            
            // Marca a migração como concluída
            this.migrationStatus.completed = true;
            localStorage.setItem('data_migration_completed', 'true');
            this.migrationStatus.messages.push("Migração concluída com sucesso!");
            
            console.log("Migração concluída com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro durante a migração:", error);
            this.migrationStatus.error = error.message;
            this.migrationStatus.messages.push(`Erro na migração: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Migra os usuários do sistema antigo para o novo
     * @returns {Promise<boolean>} - Promessa que resolve com true se a migração for bem-sucedida
     */
    async migrateUsers() {
        try {
            // Obter os usuários do sistema antigo (simulado, já que não temos acesso direto)
            const oldUsers = window.INITIAL_USERS || [];
            
            // Para cada usuário antigo, salva no novo sistema
            for (const user of oldUsers) {
                await this.dataStorage.saveData('users', { ...user }, true);
            }
            
            console.log(`${oldUsers.length} usuários migrados com sucesso.`);
            return true;
        } catch (error) {
            console.error("Erro ao migrar usuários:", error);
            throw error;
        }
    }
    
    /**
     * Migra a configuração de tema
     * @returns {Promise<boolean>} - Promessa que resolve com true se a migração for bem-sucedida
     */
    async migrateThemeConfig() {
        try {
            const theme = localStorage.getItem('theme');
            if (theme) {
                await this.dataStorage.saveConfig('theme', theme);
                console.log("Configuração de tema migrada com sucesso.");
            }
            return true;
        } catch (error) {
            console.error("Erro ao migrar configuração de tema:", error);
            throw error;
        }
    }
    
    /**
     * Migra as tentativas de login
     * @returns {Promise<boolean>} - Promessa que resolve com true se a migração for bem-sucedida
     */
    async migrateLoginAttempts() {
        try {
            const loginAttempts = localStorage.getItem('login_attempts');
            if (loginAttempts) {
                const attempts = JSON.parse(loginAttempts);
                await this.dataStorage.saveConfig('login_attempts', attempts);
                console.log("Tentativas de login migradas com sucesso.");
            }
            return true;
        } catch (error) {
            console.error("Erro ao migrar tentativas de login:", error);
            throw error;
        }
    }
    
    /**
     * Migra os dados da sessão atual
     * @returns {Promise<boolean>} - Promessa que resolve com true se a migração for bem-sucedida
     */
    async migrateSessionData() {
        try {
            // Verificar se há sessão ativa no sistema antigo
            if (this.oldAuthSystem.isAuthenticated()) {
                const currentUser = this.oldAuthSystem.getCurrentUser();
                if (currentUser) {
                    // Salva a sessão no novo sistema, mantendo o "lembrar-me"
                    const rememberMe = !!localStorage.getItem('user_session');
                    this.dataStorage.saveSession(currentUser, rememberMe);
                    console.log("Dados da sessão migrados com sucesso.");
                }
            }
            return true;
        } catch (error) {
            console.error("Erro ao migrar dados da sessão:", error);
            throw error;
        }
    }
    
    /**
     * Migra outros dados do localStorage
     * @returns {Promise<boolean>} - Promessa que resolve com true se a migração for bem-sucedida
     */
    async migrateLocalStorageData() {
        try {
            // Processa todas as chaves do localStorage
            const keysToProcess = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Filtra chaves já processadas e sistemas
                if (!key.startsWith('data_migration') && 
                    key !== 'theme' && 
                    key !== 'login_attempts' && 
                    key !== 'user_session') {
                    keysToProcess.push(key);
                }
            }
            
            // Processa cada chave
            for (const key of keysToProcess) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        // Tenta parsear como JSON
                        try {
                            const parsedData = JSON.parse(data);
                            
                            // Determina o tipo de dado com base no prefixo da chave
                            let dataType = null;
                            let dataId = null;
                            
                            // Processa chaves com formato específico: tipo_id
                            const keyParts = key.split('_');
                            if (keyParts.length >= 2) {
                                const storeType = keyParts[0];
                                if (this.storeMapping[storeType]) {
                                    dataType = this.storeMapping[storeType];
                                    dataId = keyParts.slice(1).join('_');
                                }
                            }
                            
                            // Se identificamos o tipo, salvamos na store correspondente
                            if (dataType && dataId) {
                                parsedData.id = dataId;
                                await this.dataStorage.saveData(dataType, parsedData);
                            } else {
                                // Caso contrário, salva como configuração geral
                                await this.dataStorage.saveConfig(key, parsedData);
                            }
                        } catch (parseError) {
                            // Se não for JSON válido, salva como string
                            await this.dataStorage.saveConfig(key, data);
                        }
                    }
                } catch (keyError) {
                    console.warn(`Erro ao processar chave ${key}:`, keyError);
                    this.migrationStatus.messages.push(`Aviso: Não foi possível migrar ${key}`);
                }
            }
            
            console.log(`${keysToProcess.length} chaves adicionais processadas.`);
            return true;
        } catch (error) {
            console.error("Erro ao migrar dados do localStorage:", error);
            throw error;
        }
    }
    
    /**
     * Obtém o status atual da migração
     * @returns {Object} - Status da migração
     */
    getStatus() {
        return { ...this.migrationStatus };
    }
}

// Script de inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Verificando necessidade de migração de dados...");
    
    // Verifica se a migração já foi concluída
    if (localStorage.getItem('data_migration_completed') === 'true') {
        console.log("Migração já foi concluída anteriormente.");
        return;
    }
    
    // Carrega os scripts necessários, se ainda não estiverem carregados
    async function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                // Script já carregado
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    try {
        // Carrega os scripts necessários
        if (!window.dataStorage) await loadScript('data-storage.js');
        if (!window.authSystem) await loadScript('auth.js');
        
        // Aguarda um pouco para garantir que os sistemas foram inicializados
        setTimeout(async () => {
            // Inicia a migração
            const migrator = new DataMigrator();
            const initialized = await migrator.init();
            
            if (initialized) {
                const migrated = await migrator.migrate();
                if (migrated) {
                    // Se a migração for bem-sucedida, pode exibir uma mensagem ao usuário
                    console.log("Migração concluída! Recarregando a página...");
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    console.error("Falha na migração de dados:", migrator.getStatus().error);
                }
            } else {
                console.error("Não foi possível inicializar o migrador.");
            }
        }, 500);
    } catch (error) {
        console.error("Erro ao carregar scripts para migração:", error);
    }
}); 