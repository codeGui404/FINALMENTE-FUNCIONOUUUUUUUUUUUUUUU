// Atualiza a lista de livros ao digitar no campo de busca
document.getElementById('buscaLivro').addEventListener('input', listarLivros)

// Adiciona um novo livro ao localStorage
function adicionarLivro() {
  const titulo = document.getElementById('tituloLivro').value.trim()
  const autor = document.getElementById('autorLivro').value.trim()

  if (titulo === '' || autor === '') {
    alert('Preencha os campos de título e autor.')
    return
  }

  // Recupera a lista de livros existente ou inicializa como array vazio
  const livros = JSON.parse(localStorage.getItem('livros') ||'[]')

  const novoLivro = {
    id: Date.now(), // ID único
    titulo,
    autor
  }

  livros.push(novoLivro) 
  localStorage.setItem('livros', JSON.stringify(livros))

  // Limpa os campos e atualiza a tabela
  document.getElementById('tituloLivro').value = ''
  document.getElementById('autorLivro').value = ''
  listarLivros()
}

// Lista os livros filtrados na tabela
function listarLivros() {
  const tabela = document.getElementById('tabelaLivros')
  const filtro = document.getElementById('buscaLivro').value.toLowerCase()
  const livros = JSON.parse(localStorage.getItem('livros') || '[]') 

  const livrosFiltrados = livros.filter(livro => livro.titulo.toLowerCase().includes(filtro) || livro.autor.toLowerCase().includes(filtro))

  // Exibe os livros na tabela
  tabela.innerHTML = livrosFiltrados.map(livro => `<tr>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>
        <button onclick="editarLivro(${livro.id})">Editar</button>
        <button onclick="excluirLivro(${livro.id})">Excluir</button>
      </td>
    </tr>
  `).join('')
}

// Edita um livro existente
function editarLivro(id) {
  const livros  = JSON.parse(localStorage.getItem('livros') || [])
  const indice = livros.findIndex(livro => livro.id === id)

  if (indice !== -1) {
    const novoTitulo = prompt('Editar título:', livros[indice].titulo)
    const novoAutor = prompt('Editar autor:', livros[indice].autor)

    if(novoTitulo && novoAutor) {
      livros[indice].titulo = novoTitulo
      livros[indice].autor = novoAutor
      localStorage.setItem('livros', JSON.stringify(livros))
      listarLivros()
    }
  } 
}

// Exclui um livro
function excluirLivro(id) {
  const livros = JSON.parse(localStorage.getItem('livros') || '[]') 
  const livro = livros.find(l => l.id === id)

  if (confirm(`Deseja excluir o livro "${livro.titulo}"?`)) {
    const novaLista = livros.filter(livro => livro.id !== id)
    localStorage.setItem('livros', JSON.stringify(novaLista))
    listarLivros()
  }
}


// ========== USUÁRIOS ==========

//Atualiza a lista de usuários ao digitar no campo de busca
document.getElementById('buscaUsuario').addEventListener('input', listarUsuarios)

// Adiciona um novo usuário ao localStorage
function adicionarUsuario() {
  const nome = prompt("Digite o nome do usuário:")
  const email = prompt("Digite o email do usuário:")

  if (!nome || !email) {
    alert("Preencha todos os campos.")
    return
  }

  const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]') 

  const novoUsuario = {
    id: Date.now(),
    nome, 
    email
  }

  usuarios.push(novoUsuario)
  localStorage.setItem('usuarios', JSON.stringify(usuarios))
  listarUsuarios()
}

// Lista os usuários filtrados na tabela
function listarUsuarios() {
  const tabela = document.getElementById('tabelaUsuarios')
  const filtro = document.getElementById('buscaUsuario').value.toLowerCase()
  const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]')

  const usuariosFiltrados = usuarios.filter(usuario => usuario.nome.toLowerCase().includes(filtro) || usuario.email.toLowerCase().includes(filtro))

  // Exibe os usuários na tabela
  tabela.innerHTML = usuariosFiltrados.map(usuario => `<tr>
      <td>${usuario.nome}</td>
      <td>${usuario.email}</td>
      <td>
        <button onclick="editarUsuario(${usuario.id})">Editar</button>
        <button onclick="excluirUsuario(${usuario.id})">Excluir</button>
      </td>
    </tr>
  `).join('')
}

// Edita um usuário existente
function editarUsuario(id) {
  const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]')
  const indice = usuarios.findIndex(usuario => usuario.id === id)

  if (indice !== -1) {
    const novoNome = prompt("Editar nome:", usuarios[indice].nome)
    const novoEmail = prompt("Editar email:", usuarios[indice].email)

    if (novoNome && novoEmail) {
      usuarios[indice].nome = novoNome
      usuarios[indice].email = novoEmail
      localStorage.setItem('usuarios', JSON.stringify(usuarios))
      listarUsuarios()
    }
  }
}

// Exclui um usuário
function excluirUsuario(id) {
  const usuarios = JSON.parse(localStorage.getItem('usuarios') || []) 
  const usuario = usuarios.find(u => u.id === id)

  if (confirm(`Deseja excluir o usuário "${usuario.nome}"?`)) {
    const novaLista = usuarios.filter(usuario =>usuario.id !== id)
    localStorage.setItem('usuarios', JSON.stringify(novaLista))
    listarUsuarios()
  }
}

// Chamada inicial ao carregar a página
listarLivros()
listarUsuarios()