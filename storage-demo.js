/**
 * Script de Demonstração do Sistema de Armazenamento
 * Este script demonstra o uso básico do novo sistema de armazenamento de dados
 */

// Apenas executa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se o sistema de armazenamento está disponível
    if (!window.dataStorage) {
        console.error("Sistema de armazenamento não encontrado. Carregue data-storage.js primeiro.");
        return;
    }
    
    // Referência para o sistema de armazenamento
    const storage = window.dataStorage;
    
    // Função para mostrar mensagens na tela
    function showDemo(title, message, isError = false) {
        console.log(`${title}: ${message}`);
        
        // Se estiver em uma página com área de demonstração, mostra no DOM
        const demoContainer = document.getElementById('storage-demo-container');
        if (demoContainer) {
            const messageElement = document.createElement('div');
            messageElement.className = `demo-message ${isError ? 'error' : 'success'}`;
            messageElement.innerHTML = `
                <h4>${title}</h4>
                <p>${typeof message === 'object' ? JSON.stringify(message) : message}</p>
            `;
            demoContainer.appendChild(messageElement);
        }
    }
    
    // Função para limpar mensagens da demo
    function clearDemo() {
        const demoContainer = document.getElementById('storage-demo-container');
        if (demoContainer) {
            demoContainer.innerHTML = '<h3>Demonstração do Sistema de Armazenamento</h3>';
        }
    }
    
    // Adicionar botão de teste se houver um container de demonstração
    const demoContainer = document.getElementById('storage-demo-container');
    if (demoContainer) {
        // Botão para executar demonstração
        const runDemoBtn = document.createElement('button');
        runDemoBtn.innerText = 'Executar Demonstração';
        runDemoBtn.className = 'demo-button';
        runDemoBtn.onclick = runDemonstration;
        
        // Botão para limpar demonstração
        const clearDemoBtn = document.createElement('button');
        clearDemoBtn.innerText = 'Limpar Resultados';
        clearDemoBtn.className = 'demo-button clear';
        clearDemoBtn.onclick = clearDemo;
        
        // Adiciona botões ao container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'demo-buttons';
        buttonContainer.appendChild(runDemoBtn);
        buttonContainer.appendChild(clearDemoBtn);
        demoContainer.appendChild(buttonContainer);
    }
    
    // Função principal de demonstração
    async function runDemonstration() {
        try {
            clearDemo();
            showDemo("Início", "Iniciando demonstração do sistema de armazenamento...");
            
            // 1. Verificar se o banco de dados está pronto
            await storage.ensureDbReady();
            showDemo("Base de Dados", "Banco de dados inicializado com sucesso");
            
            // 2. Salvar uma configuração
            const configKey = "demo_config";
            const configValue = {
                demoRun: true,
                timestamp: new Date().toISOString(),
                counter: Math.floor(Math.random() * 100) + 1
            };
            
            await storage.saveConfig(configKey, configValue);
            showDemo("Configuração", "Configuração de demonstração salva com sucesso");
            
            // 3. Recuperar a configuração
            const retrievedConfig = await storage.getConfig(configKey);
            showDemo("Configuração Recuperada", retrievedConfig);
            
            // 4. Salvar um estudante (exemplo de entidade)
            const estudanteId = storage.generateId();
            const estudanteData = {
                id: estudanteId,
                nome: "Estudante de Demonstração",
                email: `estudante.demo${estudanteId}@djamec.com`,
                curso: "Engenharia de Computação",
                matricula: "DEMO" + Math.floor(Math.random() * 10000),
                telefone: "(00) 12345-6789", // Será criptografado
                dataMatricula: new Date().toISOString()
            };
            
            await storage.saveData("estudantes", estudanteData, true);
            showDemo("Estudante", "Dados do estudante de demonstração salvos com sucesso");
            
            // 5. Recuperar o estudante
            const retrievedEstudante = await storage.getData("estudantes", estudanteId, true);
            showDemo("Estudante Recuperado", retrievedEstudante);
            
            // 6. Salvar várias cadeiras (disciplinas) relacionadas ao mesmo curso
            const cursoDemonstração = "Engenharia de Computação";
            const cadeiras = [
                {
                    id: storage.generateId(),
                    nome: "Banco de Dados",
                    professor: "Prof. Exemplo Silva",
                    curso: cursoDemonstração,
                    cargaHoraria: 60,
                    semestre: 4
                },
                {
                    id: storage.generateId(),
                    nome: "Programação Web",
                    professor: "Profa. Modelo Santos",
                    curso: cursoDemonstração,
                    cargaHoraria: 80,
                    semestre: 5
                },
                {
                    id: storage.generateId(),
                    nome: "Inteligência Artificial",
                    professor: "Prof. Teste Oliveira",
                    curso: cursoDemonstração,
                    cargaHoraria: 60,
                    semestre: 7
                }
            ];
            
            // Salva cada cadeira
            for (const cadeira of cadeiras) {
                await storage.saveData("cadeiras", cadeira);
            }
            showDemo("Cadeiras", `${cadeiras.length} cadeiras salvas com sucesso`);
            
            // 7. Consultar cadeiras pelo curso
            const retrievedCadeiras = await storage.queryData("cadeiras", "curso", cursoDemonstração);
            showDemo("Cadeiras Recuperadas", `Encontradas ${retrievedCadeiras.length} cadeiras para o curso ${cursoDemonstração}`);
            showDemo("Detalhes", retrievedCadeiras);
            
            // 8. Atualizar um registro
            if (retrievedCadeiras.length > 0) {
                const cadeiraToUpdate = retrievedCadeiras[0];
                cadeiraToUpdate.cargaHoraria += 20;
                cadeiraToUpdate.observacao = "Carga horária atualizada na demonstração";
                
                await storage.saveData("cadeiras", cadeiraToUpdate);
                showDemo("Atualização", `Cadeira ${cadeiraToUpdate.nome} atualizada com sucesso`);
                
                // Verificar a atualização
                const updatedCadeira = await storage.getData("cadeiras", cadeiraToUpdate.id);
                showDemo("Verificação", `Nova carga horária: ${updatedCadeira.cargaHoraria}h`);
            }
            
            // 9. Excluir o estudante de demonstração
            await storage.deleteData("estudantes", estudanteId);
            showDemo("Exclusão", `Estudante de demonstração removido com sucesso`);
            
            // 10. Verificar se o estudante foi excluído
            const deletedEstudante = await storage.getData("estudantes", estudanteId);
            showDemo("Verificação de Exclusão", deletedEstudante ? "Estudante ainda existe!" : "Estudante não encontrado, exclusão confirmada");
            
            // 11. Demonstrar criptografia (simulação)
            showDemo("Segurança", "Demonstração de criptografia básica de dados sensíveis");
            
            const dadosSensiveis = {
                id: "demo_sensitive",
                nome: "Usuário de Teste",
                email: "teste@exemplo.com",
                password: "SenhaS3creta123!",
                cpf: "123.456.789-00",
                telefone: "(11) 98765-4321"
            };
            
            // Salvar com criptografia
            await storage.saveData("users", dadosSensiveis, true);
            showDemo("Dados Sensíveis", "Dados sensíveis salvos com criptografia");
            
            // Recuperar sem descriptografar para verificar formato
            const encryptedData = await storage.getData("users", "demo_sensitive", false);
            showDemo("Formato Criptografado", "Observe que os campos sensíveis estão em formato diferente", false);
            showDemo("Dados Criptografados", encryptedData);
            
            // Recuperar com descriptografia
            const decryptedData = await storage.getData("users", "demo_sensitive", true);
            showDemo("Dados Descriptografados", "Dados sensíveis recuperados com descriptografia");
            showDemo("Dados Completos", decryptedData);
            
            // 12. Limpar dados da demonstração
            await storage.deleteData("users", "demo_sensitive");
            await storage.deleteData("config", configKey);
            
            // Limpa as cadeiras criadas na demonstração
            for (const cadeira of retrievedCadeiras) {
                await storage.deleteData("cadeiras", cadeira.id);
            }
            
            showDemo("Conclusão", "Demonstração concluída com sucesso! Os dados temporários foram removidos.");
            
        } catch (error) {
            console.error("Erro durante a demonstração:", error);
            showDemo("ERRO", error.message, true);
        }
    }
    
    // Execute a demonstração automaticamente se estiver na página de demonstração
    if (window.location.pathname.includes('storage-demo.html')) {
        // Executa após um pequeno atraso para garantir que tudo foi carregado
        setTimeout(runDemonstration, 500);
    }
}); 