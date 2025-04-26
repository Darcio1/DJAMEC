// Script dedicado para funcionamento do logout
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de logout carregado');
    
    // Verifica se o sistema de autenticação está disponível
    if (!window.authSystem) {
        console.warn('Sistema de autenticação não encontrado, carregando script de autenticação...');
        
        // Carrega dinamicamente o script de autenticação se não estiver disponível
        const authScript = document.createElement('script');
        authScript.src = 'auth.js';
        authScript.onload = function() {
            window.authSystem = new AuthSystem();
            initLogoutFunctions();
        };
        document.head.appendChild(authScript);
    } else {
        initLogoutFunctions();
    }
    
    // Função para inicializar as funcionalidades de logout
    function initLogoutFunctions() {
        // Função de logout utilizando o sistema de autenticação
        function handleLogout() {
            console.log('Função de logout executada');
            if (confirm('Tem certeza que deseja sair?')) {
                console.log('Logout confirmado');
                
                // Utiliza o sistema de autenticação para fazer logout
                window.authSystem.logout();
            }
        }
        
        // Botão de logout na sidebar
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            console.log('Botão de logout na sidebar encontrado');
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
            });
        } else {
            console.error('Botão de logout na sidebar não encontrado!');
        }
        
        // Botão de logout na topbar
        const topbarLogoutBtn = document.getElementById('topbarLogoutBtn');
        if (topbarLogoutBtn) {
            console.log('Botão de logout na topbar encontrado');
            topbarLogoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
            });
        } else {
            console.error('Botão de logout na topbar não encontrado!');
        }
        
        // Adicionar atributo de cursor nos botões de logout
        if (logoutBtn) logoutBtn.style.cursor = 'pointer';
        if (topbarLogoutBtn) topbarLogoutBtn.style.cursor = 'pointer';
    }
}); 