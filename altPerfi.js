// --- Função para Carregar os Dados do Perfil do Local Storage ---
function carregarDados() {
    // Tenta obter o nome do usuário logado primeiro
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (usuarioLogadoString && JSON.parse(usuarioLogadoString).nome) {
        document.getElementById('nome').value = JSON.parse(usuarioLogadoString).nome;
    } else {
        // Se não houver em usuarioLogado, tenta obter da chave 'nome' antiga
        document.getElementById('nome').value = localStorage.getItem('nome') || '';
    }
    document.getElementById('pais').value = localStorage.getItem('pais') || '';
    document.getElementById('estado').value = localStorage.getItem('estado') || '';
}

// --- Função para Salvar os Dados do Perfil no Local Storage ---
function salvarPerfil() {
    const novoNome = document.getElementById('nome').value;
    localStorage.setItem('nome', novoNome);
    localStorage.setItem('pais', document.getElementById('pais').value);
    localStorage.setItem('estado', document.getElementById('estado').value);

    // Atualiza o nome dentro do objeto usuarioLogado, se existir
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (usuarioLogadoString) {
        const usuarioLogado = JSON.parse(usuarioLogadoString);
        usuarioLogado.nome = novoNome;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    }

    alert('Perfil atualizado!');
    window.location.href = 'perfil.html';
}

// --- Chamada da Função para Carregar os Dados ao Carregar a Página ---
carregarDados();

document.addEventListener('DOMContentLoaded', () => {
    const inputPais = document.getElementById('pais');
    const listaSugestoes = document.getElementById('sugestoes-paises');

    inputPais.addEventListener('input', async () => {
        const query = inputPais.value.trim();
        listaSugestoes.innerHTML = '';

        if (query.length < 2) return; // só busca com 2 ou mais letras

        try {
            const response = await fetch(`https://restcountries.com/v3.1/name/${query}`);
            const data = await response.json();

            const paises = data.map(p => p.name.common).slice(0, 10); // limita a 10 sugestões

            paises.forEach(pais => {
                const li = document.createElement('li');
                li.textContent = pais;
                li.onclick = () => {
                    inputPais.value = pais;
                    listaSugestoes.innerHTML = '';
                };
                listaSugestoes.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao buscar países:', error);
        }
    });

    // Esconde as sugestões se clicar fora
    document.addEventListener('click', (e) => {
        if (e.target !== inputPais) {
            listaSugestoes.innerHTML = '';
        }
    });
});