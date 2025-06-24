const API_BASE_URL = 'https://api-controle-de-filmes.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const msgElement = document.getElementById('msg');

    if (!loginForm) {
        console.error('Formulário de login não encontrado!');
        return; // Para evitar erros se o formulário não existir
    }

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        msgElement.textContent = 'Autenticando...';
        msgElement.style.color = 'gray';

        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(email + ":" + password)
                }
            });

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('credentials', btoa(email + ":" + password));
                window.location.href = 'homeCliente.html';
            } else if (response.status === 401) {
                msgElement.style.color = 'red';
                msgElement.textContent = 'Erro: Email ou senha inválidos.';
            } else {
                const error = await response.json();
                msgElement.style.color = 'red';
                msgElement.textContent = error.message || 'Ocorreu um erro inesperado ao tentar fazer login.';
            }
        } catch (error) {
            console.error('Erro no login:', error);
            msgElement.style.color = 'red';
            msgElement.textContent = 'Erro de conexão. Verifique o console para mais detalhes.';
        }
    });
});
