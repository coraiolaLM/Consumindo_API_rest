const API_BASE_URL = 'https://api-controle-de-filmes.onrender.com';

async function fetchWithAuth(url, options = {}) {
    const credentials = sessionStorage.getItem('credentials');
    
    if (!credentials) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        window.location.href = 'login.html';
        return Promise.reject('No authentication data');
    }

    const headers = new Headers(options.headers || {});
    headers.append('Authorization', `Basic ${credentials}`);
    
    if (!headers.has('Content-Type') && options.body) {
        headers.append('Content-Type', 'application/json');
    }

    options.headers = headers;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
        const response = await fetch(fullUrl, options);
        
        if (response.status === 401) {
            sessionStorage.removeItem('credentials');
            alert('Sessão inválida. Por favor, faça login novamente.');
            window.location.href = 'login.html';
            return Promise.reject('Unauthorized');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            return Promise.reject(errorData);
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('general-message').textContent = 'Erro de conexão com a API.';
        document.getElementById('general-message').style.display = 'block';
        return Promise.reject(error);
    }
}

function updateFilmList(elementId, filmes) {
    const container = document.getElementById(elementId);
    
    if (!filmes || filmes.length === 0) {
        container.innerHTML = '<div class="no-films"><i class="fas fa-film"></i> Nenhum filme encontrado.</div>';
        return;
    }

    let html = '';
    
    filmes.forEach(item => {
        const filme = item.filme ? item.filme : item;
        
        if (!filme) {
            console.error('Dados de filme inválidos:', item);
            return;
        }

        html += `
        <div class="film-item">
            <div class="film-info">
                <div class="film-title">${filme.titulo || 'Título não disponível'}</div>
                <div class="film-details">
                    <span>${filme.anoLancamento || 'N/I'}</span>
                    <span>${filme.genero || 'Gênero não informado'}</span>
                </div>
            </div>
            
            <div class="film-actions">
                ${elementId === 'lista-todos-filmes' ? `
                    <button class="action-btn" onclick="adicionarParaAssistir(${filme.id})">
                        <i class="fas fa-plus"></i> Quero Assistir
                    </button>
                ` : ''}
                
                ${elementId === 'lista-para-assistir' ? `
                    <button class="action-btn" onclick="marcarComoAssistido(${item.id})">
                        <i class="fas fa-check"></i> Assistido
                    </button>
                    <button class="action-btn remove-btn" onclick="removerParaAssistir(${item.id})">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                ` : ''}
                
                ${elementId === 'lista-assistidos' && item.dataAssistido ? `
                    <span class="watched-date">
                        <i class="fas fa-calendar-check"></i> ${new Date(item.dataAssistido).toLocaleDateString()}
                    </span>
                ` : ''}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

async function loadHomePageData() {
    try {
        ['lista-para-assistir', 'lista-assistidos', 'lista-todos-filmes'].forEach(id => {
            document.getElementById(id).innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
        });

        const response = await fetchWithAuth('/home');
        const data = await response.json();
        
        if (data.dados) {
            updateFilmList('lista-para-assistir', data.dados.filmesParaAssistir);
            updateFilmList('lista-assistidos', data.dados.filmesAssistidos);
            updateFilmList('lista-todos-filmes', data.dados.filmes);
            
            if (data.mensagem) {
                const messageElement = document.getElementById('general-message');
                messageElement.textContent = data.mensagem;
                messageElement.style.display = 'block';
                
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 5000);
            }
        }
    } catch(error) {
        console.error("Falha ao carregar dados:", error);
        const message = error.erro || error.message || 'Erro ao carregar dados';
        
        const messageElement = document.getElementById('general-message');
        messageElement.textContent = message;
        messageElement.style.display = 'block';
    }
}

function setupCollapsibleSections() {
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach(header => {
        const content = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon i');
        const sectionId = header.closest('.section').id;

        const isExpanded = localStorage.getItem(`collapsible_${sectionId}`) === 'true';

        if (isExpanded) {
            header.classList.add('active');
            content.classList.add('active');
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
        }

        header.addEventListener('click', function() {
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                toggleIcon.classList.remove('fa-chevron-up');
                toggleIcon.classList.add('fa-chevron-down');
                localStorage.setItem(`collapsible_${sectionId}`, 'false');
            } else {
                content.classList.add('active');
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-up');
                localStorage.setItem(`collapsible_${sectionId}`, 'true');
            }
        });
    });
}

window.adicionarParaAssistir = async function(filmeId) {
    try {
        const response = await fetchWithAuth('/api/filmes/adicionarParaAssistir', {
            method: 'POST',
            body: JSON.stringify({ filmeId })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.mensagem || 'Filme adicionado com sucesso!', 'success');
            loadHomePageData();
        }
    } catch(error) {
        console.error("Falha ao adicionar filme:", error);
        showNotification(error.erro || error.message || 'Erro ao adicionar filme.', 'error');
    }
}

window.marcarComoAssistido = async function(filmeUsuarioId) {
    try {
        const response = await fetchWithAuth('/api/filmes/marcarComoAssistido', {
            method: 'POST',
            body: JSON.stringify({ filmeUsuarioId })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.mensagem || 'Filme marcado como assistido!', 'success');
            loadHomePageData();
        }
    } catch(error) {
        console.error("Falha ao marcar como assistido:", error);
        showNotification(error.erro || error.message || 'Erro ao marcar filme.', 'error');
    }
}

window.removerParaAssistir = async function(filmeUsuarioId) {
    if (!confirm('Tem certeza que deseja remover este filme da sua lista?')) {
        return;
    }

    try {
        const response = await fetchWithAuth('/api/filmes/removerParaAssistir', {
            method: 'POST',
            body: JSON.stringify({ filmeUsuarioId })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.mensagem || 'Filme removido da lista.', 'success');
            loadHomePageData();
        }
    } catch(error) {
        console.error("Falha ao remover filme:", error);
        showNotification(error.erro || error.message || 'Erro ao remover filme.', 'error');
    }
}

document.getElementById('form-cadastrar-filme').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const genero = document.getElementById('genero').value.trim();
    const anoLancamento = document.getElementById('anoLancamento').value.trim();

    if (!titulo || !genero || !anoLancamento) {
        showNotification('Por favor, preencha todos os campos.', 'warning');
        return;
    }

    try {
        const response = await fetchWithAuth('/api/filmes/cadastrar', {
            method: 'POST',
            body: JSON.stringify({
                titulo,
                genero,
                anoLancamento: parseInt(anoLancamento)
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.mensagem || 'Filme cadastrado com sucesso!', 'success');
            document.getElementById('form-cadastrar-filme').reset();
            loadHomePageData();
        }
    } catch(error) {
        console.error("Falha ao cadastrar filme:", error);
        showNotification(error.erro || error.message || 'Erro ao cadastrar filme.', 'error');
    }
});

document.getElementById('form-pesquisa').addEventListener('submit', async function(e) {
    e.preventDefault();
    const searchTerm = this.search.value.trim();
    
    if (searchTerm) {
        try {
            const response = await fetchWithAuth(`/home?search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            
            if (data.dados) {
                updateFilmList('lista-todos-filmes', data.dados.filmes);
            }
        } catch(error) {
            console.error("Falha na pesquisa:", error);
        }
    }
});

document.getElementById('logoutButton').addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.removeItem('credentials');
    window.location.href = 'login.html';
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('credentials')) {
        window.location.href = 'login.html';
        return;
    }

    document.querySelector('.mobile-menu-button').addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
        this.querySelector('i').classList.toggle('fa-bars');
    });

    setupCollapsibleSections();
    loadHomePageData();
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const msgElement = document.getElementById('msg');

    if (!loginForm) {
        console.error('Formulário de login não encontrado!');
        return;
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