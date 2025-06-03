// Inicializa um Set para armazenar os IDs dos livros favoritos, recuperando-os do localStorage se existirem.
let favorites = new Set(JSON.parse(localStorage.getItem('favorites')) || []);

// AGORA: Inicializa um array para armazenar as resenhas dos livros, recuperando-as do localStorage se existirem.
// Cada item no array será um objeto de resenha com bookId, text, rating e timestamp.
const userReviews = JSON.parse(localStorage.getItem('userReviews')) || [];

// Função para verificar se o usuário está logado
function isUserLoggedIn() {
    return localStorage.getItem('usuarioLogado') !== null;
}

// Função assíncrona para buscar livros na API do Google Books com base na pesquisa do usuário.
async function searchBooks() {
    const query = document.getElementById("searchInput").value;
    const bookListDiv = document.getElementById("bookList");

    // Se a pesquisa estiver vazia, exibe os livros sugeridos novamente.
    if (!query) {
        displaySuggestedBooks();
        return;
    }

    // Oculta os livros sugeridos quando uma pesquisa é iniciada
    bookListDiv.innerHTML = '';

    try {
        // Faz uma requisição para a API do Google Books com o termo de pesquisa codificado na URL.
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);

        // Verifica se a resposta da rede foi bem-sucedida (status 200-299)
        if (!response.ok) {
            throw new Error(`Erro HTTP! Status: ${response.status}`);
        }

        // Converte a resposta da API para formato JSON.
        const data = await response.json();

        // Se a API não retornar nenhum item, exibe uma mensagem informando.
        if (!data.items) {
            bookListDiv.innerHTML = "<p>Nenhum resultado encontrado.</p>";
            return;
        }

        // Chama a função para renderizar os livros encontrados na tela.
        renderBooks(data.items);
    } catch (error) {
        // Exibe uma mensagem de erro amigável para o usuário
        console.error("Erro ao buscar livros:", error);
        bookListDiv.innerHTML = "<p>Ocorreu um erro ao buscar os livros. Tente novamente mais tarde.</p>";
    }
}

// Nova função para buscar e exibir livros sugeridos
async function displaySuggestedBooks() {
    const suggestedQueries = ["fantasy", "fiction", "science", "history", "biography", "cooking"]; // Exemplos de categorias/temas
    const bookListDiv = document.getElementById("bookList");
    bookListDiv.innerHTML = '<h2>Livros Sugeridos</h2>'; // Título para os livros sugeridos

    for (const query of suggestedQueries) {
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=4`); // Limita os resultados para não sobrecarregar
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data.items) {
                // Renderiza apenas alguns livros de cada categoria para manter a página concisa
                renderBooks(data.items.slice(0, 3));
            }
        } catch (error) {
            console.error(`Erro ao buscar livros sugeridos para "${query}":`, error);
        }
    }
}

// Função para renderizar a lista de livros na interface do usuário.
function renderBooks(books) {
    const list = document.getElementById("bookList");
    // Limpa qualquer conteúdo anterior na lista de livros APENAS se não for uma sugestão.
    // Para sugestões, queremos adicionar aos existentes.
    if (!list.innerHTML.includes('<h2>Livros Sugeridos</h2>') && document.getElementById("searchInput").value) {
        list.innerHTML = "";
    }

    const loggedIn = isUserLoggedIn(); // Verifica o status de login uma vez

    // Itera sobre cada livro na lista de livros recebida.
    books.forEach(bookItem => {
        const info = bookItem.volumeInfo;
        const bookId = bookItem.id;
        // Obtém o título do livro ou define como "Sem título" se não houver.
        const title = info.title || "Sem título";
        // Obtém os autores do livro ou define como "Autor desconhecido" se não houver.
        const authors = info.authors ? info.authors.join(", ") : "Autor desconhecido";
        // Obtém o link da miniatura da capa do livro ou usa um placeholder se não houver.
        const thumbnail = info.imageLinks ? info.imageLinks.thumbnail : "https://via.placeholder.com/128x200?text=Sem+Capa";

        // Encontra a resenha existente para este livro no array userReviews
        const existingReview = userReviews.find(review => review.bookId === bookId);
        const reviewText = existingReview ? existingReview.text : "";
        const reviewRating = existingReview ? existingReview.rating : 0;

        // Cria um novo elemento div para representar o card do livro.
        const card = document.createElement("div");
        card.className = "book-card";
        // Define o conteúdo HTML do card do livro, incluindo imagem, título, autor, botão de favorito e área de resenha.
        card.innerHTML = `
            <img src="${thumbnail}" alt="Capa do livro ${title}" />
            <h3>${title}</h3>
            <p><strong>Autor:</strong> ${authors}</p>
            <button class="favorite-btn" onclick="${loggedIn ? `toggleFavorite('${bookId}')` : `redirectToLogin()`}">
                ${favorites.has(bookId) ? "★ Favoritado" : "☆ Favoritar"}
            </button>
            <div class="review-box">
                <div class="star-rating" data-book-id="${bookId}">
                    ${[5, 4, 3, 2, 1].map(i => `
                        <input type="radio" id="star${i}-${bookId}" name="rating-${bookId}" value="${i}" ${reviewRating === i ? 'checked' : ''} ${!loggedIn ? 'disabled' : ''}>
                        <label for="star${i}-${bookId}" title="${i} estrelas">&#9733;</label>
                    `).join('')}
                </div>
                <textarea id="review-${bookId}" placeholder="Escreva sua resenha..." ${!loggedIn ? 'disabled' : ''}>${reviewText}</textarea>
                <button class="submit-review" onclick="${loggedIn ? `submitReview('${bookId}', '${title}')` : `redirectToLoginReview()`}" ${!loggedIn ? 'disabled' : ''}>Salvar Resenha</button>
            </div>
        `;
        // Adiciona o card do livro à lista de livros na página.
        list.appendChild(card);
    });
}

// Função para adicionar ou remover um livro da lista de favoritos.
function toggleFavorite(id) {
    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    // Verifica se o livro já está nos favoritos.
    if (favorites.has(id)) {
        // Se estiver, remove o ID do Set de favoritos.
        favorites.delete(id);
    } else {
        // Se não estiver, adiciona o ID ao Set de favoritos.
        favorites.add(id);
    }
    // Atualiza o localStorage com a nova lista de IDs favoritos.
    localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
    // Re-renderiza os botões de favorito sem fazer uma nova busca na API.
    const bookCards = document.querySelectorAll('.book-card');
    bookCards.forEach(card => {
        // Encontra o ID do livro associado ao card.
        const bookId = card.querySelector('.review-box textarea')?.id.split('-')[1];
        // Se o ID do card corresponder ao ID do livro que foi favoritado/desfavoritado.
        if (bookId === id) {
            const favButton = card.querySelector('.favorite-btn');
            // Atualiza o texto do botão de favorito com base no estado atual nos favoritos.
            favButton.textContent = favorites.has(id) ? "★ Favoritado" : "☆ Favoritar";
        }
    });
}

// Função para salvar a resenha de um livro no localStorage, incluindo a pontuação de estrelas.
// Adicionado `bookTitle` como parâmetro para ser salvo junto com a resenha
function submitReview(id, bookTitle) {
    if (!isUserLoggedIn()) {
        redirectToLoginReview();
        return;
    }

    // Obtém a referência da textarea da resenha para o livro específico.
    const textarea = document.getElementById(`review-${id}`);
    const reviewText = textarea.value;

    // Obtém a pontuação de estrelas selecionada
    const ratingInput = document.querySelector(`input[name="rating-${id}"]:checked`);
    const rating = ratingInput ? parseInt(ratingInput.value) : 0;

    // Se o texto da resenha estiver vazio e a pontuação for 0, não salva a resenha
    if (reviewText.trim() === "" && rating === 0) {
        alert("Por favor, escreva uma resenha ou selecione as estrelas antes de salvar.");
        return;
    }

    // Encontra o índice da resenha existente para este livro
    const existingReviewIndex = userReviews.findIndex(review => review.bookId === id);

    const newReview = {
        bookId: id,
        bookTitle: bookTitle, // Salva o título do livro
        text: reviewText,
        rating: rating,
        timestamp: Date.now() // Adiciona um timestamp único
    };

    if (existingReviewIndex > -1) {
        // Se a resenha já existe, atualiza-a
        userReviews[existingReviewIndex] = newReview;
    } else {
        // Se a resenha não existe, adiciona-a
        userReviews.push(newReview);
    }

    // Salva o array de resenhas atualizado no localStorage.
    localStorage.setItem('userReviews', JSON.stringify(userReviews));
    alert("Resenha salva!");
}

// Funções para redirecionar para a página de login
function redirectToLogin() {
    alert("Você precisa fazer login para favoritar um livro!");
    window.location.href = "login.html";
}

function redirectToLoginReview() {
    alert("Você precisa fazer login para salvar uma resenha!");
    window.location.href = "login.html";
}

// Exibe os livros sugeridos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const linkPerfil = document.getElementById('linkPerfil');
    const spanPerfilText = linkPerfil.querySelector('span'); // Obtém o span dentro do link

    if (!usuarioLogado) {
        // Se não estiver logado, muda o texto para "Login" e redireciona o link para a página de login
        spanPerfilText.textContent = "Login"; // Altera o texto visível
        linkPerfil.href = "login.html";
        // Adiciona um evento de clique para exibir um alerta antes de redirecionar
        linkPerfil.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o redirecionamento imediato
            alert("Você precisa fazer login para acessar seu perfil!");
            window.location.href = "login.html"; // Redireciona após o alerta
        });
    } else {
        // Se estiver logado, garante que o texto seja "Meu Perfil" e o link seja para perfil.html
        spanPerfilText.textContent = "Meu Perfil";
        linkPerfil.href = "perfil.html";
        // Remove qualquer ouvinte de evento que poderia ter sido adicionado anteriormente para redirecionamento de login
        // (Isso é importante se o usuário puder fazer login e sair repetidamente na mesma sessão de página)
        // Para remover um event listener, você precisa da mesma função que foi adicionada.
        // Uma abordagem mais robusta seria ter uma função nomeada para o event listener do click.
        // Por simplicidade aqui, vamos apenas sobrescrever.
        linkPerfil.onclick = null; // Remove qualquer handler de clique inline ou adicionado previamente
    }

    // Display suggested books when the page loads
    displaySuggestedBooks();

    // Adiciona um evento ao input de pesquisa para monitorar quando ele é limpo
    document.getElementById("searchInput").addEventListener('input', (event) => {
        if (event.target.value === '') {
            displaySuggestedBooks(); // Exibe os livros sugeridos novamente se a pesquisa for limpa
        }
    });
});