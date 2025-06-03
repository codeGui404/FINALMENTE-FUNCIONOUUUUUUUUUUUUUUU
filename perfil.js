// --- Lógica para o Botão de Edição de Perfil ---
document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o botão de edição pelo ID para maior robustez
    const editButton = document.getElementById('editProfileButton');

    if (editButton) {
        editButton.addEventListener('click', function() {
            const editPageUrl = 'altPerfil.html';
            window.location.href = editPageUrl;
        });
    } else {
        console.warn('Botão "Editar Perfil" não encontrado. Verifique o HTML.');
    }
});

// --- Função para Carregar e Exibir os Dados do Perfil ---
function carregarPerfil() {
    // Tenta obter o nome do usuário logado do localStorage
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    let nome = 'Nome não definido';
    if (usuarioLogadoString) {
        try { // Adiciona try-catch para um parsing JSON mais robusto
            const usuarioLogado = JSON.parse(usuarioLogadoString);
            nome = usuarioLogado.nome || 'Nome não definido';
        } catch (e) {
            console.error("Erro ao fazer parse de 'usuarioLogado' do localStorage:", e);
        }
    }

    const dataRegistro = localStorage.getItem('dataRegistro') || new Date().toLocaleDateString('pt-BR'); // Formato BR
    const pais = localStorage.getItem('pais') || 'Desconhecido';
    const estado = localStorage.getItem('estado') || 'Desconhecido';

    document.getElementById('nome').textContent = nome;
    document.getElementById('dataRegistro').textContent = dataRegistro;
    document.getElementById('pais').textContent = pais;
    document.getElementById('estado').textContent = estado;

    // Salva a Data de Registro se Ainda Não Existir (apenas na primeira vez)
    if (!localStorage.getItem('dataRegistro')) {
        localStorage.setItem('dataRegistro', dataRegistro);
    }
}

// --- Lógica para os Livros Favoritos ---

// Recupera os IDs dos livros favoritos do localStorage.
const favoriteIds = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
const favoriteListDiv = document.getElementById('favoriteList');

// Função para remover um livro dos favoritos
function removeFromFavorites(bookId) {
    favoriteIds.delete(bookId);
    localStorage.setItem('favorites', JSON.stringify(Array.from(favoriteIds)));

    const bookCardToRemove = document.getElementById(`book-card-${bookId}`);
    if (bookCardToRemove) {
        bookCardToRemove.remove();

        if (favoriteIds.size === 0) {
            favoriteListDiv.innerHTML = '<p class="no-favorites">Você ainda não adicionou nenhum livro aos seus favoritos.</p>';
        }
    } else {
        console.warn(`Card do livro com ID 'book-card-${bookId}' não encontrado para remoção.`);
    }
}

// Função assíncrona para buscar os detalhes dos livros favoritos.
async function fetchFavoriteBooks() {
    favoriteListDiv.innerHTML = ""; // Limpa o conteúdo atual

    if (favoriteIds.size === 0) {
        favoriteListDiv.innerHTML = '<p class="no-favorites">Você ainda não adicionou nenhum livro aos seus favoritos.</p>';
        return;
    }

    const bookDetailsPromises = Array.from(favoriteIds).map(id =>
        fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
            .then(response => {
                if (!response.ok) {
                    console.error(`Erro HTTP ao buscar detalhes do livro ${id}: ${response.status}`);
                    return null;
                }
                return response.json();
            })
            .catch(error => {
                console.error(`Erro de rede ou JSON ao buscar detalhes do livro ${id}:`, error);
                return null;
            })
    );

    const favoriteBooksData = await Promise.all(bookDetailsPromises);
    const validFavoriteBooks = favoriteBooksData.filter(book => book && book.volumeInfo);

    if (validFavoriteBooks.length > 0) {
        renderFavoriteBooks(validFavoriteBooks);
    } else {
        favoriteListDiv.innerHTML = '<p class="no-favorites">Não foi possível carregar os detalhes de seus livros favoritos.</p>';
    }
}

// Função para renderizar os detalhes dos livros favoritos na página.
function renderFavoriteBooks(books) {
    books.forEach(bookItem => {
        const info = bookItem.volumeInfo;
        const bookId = bookItem.id;
        const title = info.title || "Sem título";
        const authors = info.authors ? info.authors.join(", ") : "Autor desconhecido";

        let thumbnailUrl = "https://via.placeholder.com/150x225?text=Sem+Capa";
        if (info.imageLinks) {
            if (info.imageLinks.thumbnail) {
                thumbnailUrl = info.imageLinks.thumbnail;
            } else if (info.imageLinks.smallThumbnail) {
                thumbnailUrl = info.imageLinks.smallThumbnail;
            } else if (info.imageLinks.medium) {
                thumbnailUrl = info.imageLinks.medium;
            } else if (info.imageLinks.small) {
                thumbnailUrl = info.imageLinks.small;
            } else if (info.imageLinks.large) {
                thumbnailUrl = info.imageLinks.large;
            }
            thumbnailUrl = thumbnailUrl.replace('http://', 'https://');
        }

        const card = document.createElement("div");
        card.className = "book-card";
        card.id = `book-card-${bookId}`;
        card.innerHTML = `
            <img src="${thumbnailUrl}" alt="Capa do livro ${title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150x225?text=Capa+Indispon%C3%ADvel';"/>
            <h3>${title}</h3>
            <p><strong>Autor:</strong> ${authors}</p>
            <button class="remove-button" onclick="removeFromFavorites('${bookId}')">Remover</button>
        `;
        favoriteListDiv.appendChild(card);
    });
}

// Obtém a referência à div onde as resenhas serão exibidas.
const reviewsListDiv = document.getElementById('reviewsList');

/**
 * Função para exibir as resenhas e notas salvas no localStorage.
 * Esta função agora sempre lê o localStorage para obter os dados mais recentes.
 */
async function displayUserReviews() { // Tornada assíncrona para usar await
    const userReviews = JSON.parse(localStorage.getItem('userReviews')) || [];
    reviewsListDiv.innerHTML = ""; // Limpa o conteúdo atual

    if (userReviews.length === 0) {
        reviewsListDiv.innerHTML = '<p class="no-reviews">Você ainda não adicionou nenhuma resenha ou nota.</p>';
        return;
    }

    // Mapeia todas as resenhas para um array de Promises
    const reviewPromises = userReviews.map(async (review, index) => {
        let thumbnailUrl = "https://via.placeholder.com/80x120?text=Sem+Capa"; // Capa padrão
        let bookTitle = review.bookTitle || 'Livro Desconhecido';

        if (review.bookId) {
            try {
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${review.bookId}`);
                if (response.ok) {
                    const bookData = await response.json();
                    if (bookData.volumeInfo && bookData.volumeInfo.imageLinks) {
                        const info = bookData.volumeInfo;
                        if (info.imageLinks.thumbnail) {
                            thumbnailUrl = info.imageLinks.thumbnail.replace('http://', 'https://');
                        } else if (info.imageLinks.smallThumbnail) {
                            thumbnailUrl = info.imageLinks.smallThumbnail.replace('http://', 'https://');
                        }
                        // Você pode adicionar mais opções de tamanho de imagem aqui, se necessário
                    }
                    bookTitle = bookData.volumeInfo.title || bookTitle; // Atualiza o título caso tenha sido salvo como desconhecido
                } else {
                    console.warn(`Não foi possível buscar detalhes para o livro com ID: ${review.bookId}. Status: ${response.status}`);
                }
            } catch (error) {
                console.error(`Erro ao buscar capa para o livro ${review.bookId}:`, error);
            }
        }

        const starRating = review.rating
            ? '<span class="star-rating">' + '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating) + '</span>'
            : 'Não Avaliado';

        const reviewContent = review.text && review.text.trim() !== ''
            ? `<p>${review.text}</p>`
            : `<p>Sem resenha.</p>`;

        return `
            <div class="review-card">
                <img src="${thumbnailUrl}" alt="Capa do livro ${bookTitle}" class="review-book-cover" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x120?text=Capa+Indispon%C3%ADvel';"/>
                <div class="review-details">
                    <h3>${bookTitle}</h3>
                    <p><strong>Nota:</strong> ${starRating}</p>
                    ${reviewContent}
                    <button class="remove-review-button" data-index="${index}">Remover Resenha</button>
                </div>
            </div>
        `;
    });

    // Espera todas as Promises de resenhas serem resolvidas e então adiciona ao DOM
    const reviewCardsHTML = await Promise.all(reviewPromises);
    reviewsListDiv.innerHTML = reviewCardsHTML.join('');

    // Adiciona event listeners para os botões de remover resenha
    document.querySelectorAll('.remove-review-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const indexToRemove = parseInt(event.target.dataset.index);
            removeUserReview(indexToRemove);
        });
    });
}

/**
 * Função para remover uma resenha do localStorage e do DOM.
 * @param {number} index O índice da resenha a ser removida no array userReviews.
 */
function removeUserReview(index) {
    let userReviews = JSON.parse(localStorage.getItem('userReviews')) || [];

    if (index > -1 && index < userReviews.length) {
        userReviews.splice(index, 1);
        localStorage.setItem('userReviews', JSON.stringify(userReviews));
        displayUserReviews(); // Re-renderiza a lista atualizada
    }
}

// --- Chamadas Iniciais ao carregar a página ---
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    fetchFavoriteBooks();
    displayUserReviews(); // Garante que as resenhas sejam carregadas na inicialização
});