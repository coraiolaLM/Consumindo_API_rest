const API_BASE_URL = 'https://api-controle-de-filmes.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    const msgElement = document.getElementById('msg');

    cadastroForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(cadastroForm);
        const usuario = {
            nome: formData.get('nome'),
            login: formData.get('login'),
            email: formData.get('email'),
            senha: formData.get('senha')
        };

        msgElement.textContent = 'Enviando...';
        msgElement.style.color = 'gray';

        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/cadastrar`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(usuario)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Erro no servidor');
            }

            const result = await response.json();
            msgElement.style.color = 'green';
            msgElement.textContent = result.mensagem + ' Redirecionando...';
            setTimeout(() => window.location.href = 'login.html', 2500);
            
        } catch (error) {
            console.error('Erro:', error);
            msgElement.style.color = 'red';
            msgElement.textContent = error.message || 'Erro ao conectar com o servidor';
        }
    });
});