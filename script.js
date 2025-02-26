const { jsPDF } = window.jspdf; // Inicializa jsPDF

let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let usuarioLogado = null;
let grafico;

// Função para alternar entre temas claro e escuro
function alternarTema() {
    document.body.classList.toggle('tema-escuro');
    localStorage.setItem('tema', document.body.classList.contains('tema-escuro') ? 'escuro' : 'claro');
}

// Função para carregar o tema salvo
function carregarTema() {
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo === 'escuro') {
        document.body.classList.add('tema-escuro');
    }
}

// Função para calcular a diferença em dias entre duas datas
function calcularDiasRestantes(dataVencimento) {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diferenca = vencimento - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24)); // Converte para dias
}

// Função para carregar contas do usuário logado
function carregarContas(filtro = 'todas') {
    const contas = usuarioLogado.contas || [];
    const contasList = document.getElementById('contasList');
    contasList.innerHTML = ''; // Limpa a lista antes de carregar

    contas.forEach((conta, index) => {
        // Aplica o filtro
        if (filtro === 'vencendo' && calcularDiasRestantes(conta.data) > 3) return;
        if (filtro === 'pagas' && !conta.paga) return;

        const novaConta = document.createElement('li');

        // Verifica se a conta está próxima do vencimento
        const diasRestantes = calcularDiasRestantes(conta.data);
        if (diasRestantes <= 3 && !conta.paga) {
            novaConta.classList.add('vencendo');
            notificarVencimento(conta);
        }

        // Verifica se a conta está paga
        if (conta.paga) {
            novaConta.classList.add('paga');
        }

        novaConta.innerHTML = `
            <span>${conta.nome} - R$ ${conta.valor} - Vencimento: ${conta.data}</span>
            <div class="acoes-btn">
                ${!conta.paga ? `<button class="editar-btn" data-index="${index}">Editar</button>` : ''}
                ${!conta.paga ? `<button class="pagar-btn" data-index="${index}">Pagar</button>` : ''}
                <button class="excluir-btn" data-index="${index}">Excluir</button>
            </div>
        `;
        contasList.appendChild(novaConta);
    });

    // Adiciona evento de clique aos botões de editar
    document.querySelectorAll('.editar-btn').forEach((botao) => {
        botao.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            abrirFormularioEdicao(index);
        });
    });

    // Adiciona evento de clique aos botões de pagar
    document.querySelectorAll('.pagar-btn').forEach((botao) => {
        botao.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            marcarComoPaga(index);
        });
    });

    // Adiciona evento de clique aos botões de exclusão
    document.querySelectorAll('.excluir-btn').forEach((botao) => {
        botao.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            excluirConta(index);
        });
    });

    // Atualiza o gráfico de gastos
    atualizarGrafico();
}

// Função para notificar vencimento
function notificarVencimento(conta) {
    if (Notification.permission === 'granted') {
        new Notification('Conta Próxima do Vencimento', {
            body: `${conta.nome} - R$ ${conta.valor} vence em ${calcularDiasRestantes(conta.data)} dias.`,
        });
    }
}

// Função para solicitar permissão de notificação
function solicitarPermissaoNotificacao() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

// Função para abrir o formulário de edição
function abrirFormularioEdicao(index) {
    const conta = usuarioLogado.contas[index];
    document.getElementById('nomeConta').value = conta.nome;
    document.getElementById('valorConta').value = conta.valor;
    document.getElementById('dataVencimento').value = conta.data;

    // Altera o botão do formulário para "Salvar Edição"
    const form = document.getElementById('contaForm');
    form.querySelector('button').textContent = 'Salvar Edição';

    // Remove o evento de submit anterior e adiciona um novo para edição
    form.onsubmit = (e) => {
        e.preventDefault();
        salvarEdicao(index);
    };
}

// Função para salvar a edição de uma conta
function salvarEdicao(index) {
    const nomeConta = document.getElementById('nomeConta').value;
    const valorConta = document.getElementById('valorConta').value;
    const dataVencimento = document.getElementById('dataVencimento').value;

    usuarioLogado.contas[index] = { nome: nomeConta, valor: valorConta, data: dataVencimento, paga: usuarioLogado.contas[index].paga };
    salvarUsuarios();
    carregarContas();

    // Reseta o formulário
    document.getElementById('contaForm').reset();
    document.getElementById('contaForm').querySelector('button').textContent = 'Adicionar Conta';
    document.getElementById('contaForm').onsubmit = (e) => {
        e.preventDefault();
        adicionarConta();
    };
}

// Função para adicionar uma nova conta
function adicionarConta() {
    const nomeConta = document.getElementById('nomeConta').value;
    const valorConta = document.getElementById('valorConta').value;
    const dataVencimento = document.getElementById('dataVencimento').value;

    usuarioLogado.contas.push({ nome: nomeConta, valor: valorConta, data: dataVencimento, paga: false });
    salvarUsuarios();
    carregarContas();

    // Limpa o formulário
    document.getElementById('contaForm').reset();
}

// Função para marcar uma conta como paga
function marcarComoPaga(index) {
    usuarioLogado.contas[index].paga = true;
    salvarUsuarios();
    carregarContas();
}

// Função para excluir uma conta
function excluirConta(index) {
    usuarioLogado.contas.splice(index, 1); // Remove a conta do array
    salvarUsuarios();
    carregarContas();
}

// Função para atualizar o gráfico de gastos
function atualizarGrafico() {
    const ctx = document.getElementById('graficoGastos').getContext('2d');

    // Agrupa os gastos por mês
    const gastosPorMes = usuarioLogado.contas.reduce((acc, conta) => {
        const mes = new Date(conta.data).toLocaleString('default', { month: 'long' });
        if (!acc[mes]) acc[mes] = 0;
        acc[mes] += parseFloat(conta.valor);
        return acc;
    }, {});

    // Dados para o gráfico
    const labels = Object.keys(gastosPorMes);
    const data = Object.values(gastosPorMes);

    // Configuração do gráfico
    if (grafico) grafico.destroy(); // Destrói o gráfico anterior
    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensais (R$)',
                data: data,
                backgroundColor: '#4CAF50',
                borderColor: '#45a049',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Função para exportar contas em PDF
function exportarParaPDF() {
    const doc = new jsPDF();
    doc.text('Contas Cadastradas', 10, 10);
    usuarioLogado.contas.forEach((conta, index) => {
        const y = 20 + (index * 10);
        doc.text(`${conta.nome} - R$ ${conta.valor} - Vencimento: ${conta.data}`, 10, y);
    });
    doc.save('contas.pdf');
}

// Função para importar dados
function importarDados(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const contasImportadas = JSON.parse(e.target.result);
            usuarioLogado.contas = contasImportadas;
            salvarUsuarios();
            carregarContas();
            alert('Dados importados com sucesso!');
        };
        reader.readAsText(file);
    }
}

// Função para salvar usuários no localStorage
function salvarUsuarios() {
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// Função para login
function login(email, senha) {
    const usuario = usuarios.find((u) => u.email === email && u.senha === senha);
    if (usuario) {
        usuarioLogado = usuario;
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('telaPrincipal').style.display = 'block';
        carregarContas();
        solicitarPermissaoNotificacao();
    } else {
        alert('Email ou senha incorretos.');
    }
}

// Função para cadastro
function cadastrar(nome, email, senha) {
    const usuarioExistente = usuarios.find((u) => u.email === email);
    if (usuarioExistente) {
        alert('Email já cadastrado.');
    } else {
        const novoUsuario = { nome, email, senha, contas: [] };
        usuarios.push(novoUsuario);
        salvarUsuarios();
        alert('Cadastro realizado com sucesso!');
        mostrarLogin();
    }
}

// Função para recuperar senha
function recuperarSenha(email) {
    const usuario = usuarios.find((u) => u.email === email);
    if (usuario) {
        alert(`Um link de recuperação foi enviado para ${email}.`);
    } else {
        alert('Email não encontrado.');
    }
}

// Função para logout
function logout() {
    usuarioLogado = null;
    document.getElementById('telaLogin').style.display = 'block';
    document.getElementById('telaPrincipal').style.display = 'none';
}

// Função para mostrar o formulário de login
function mostrarLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('cadastroForm').style.display = 'none';
    document.getElementById('recuperarSenhaForm').style.display = 'none';
}

// Função para mostrar o formulário de cadastro
function mostrarCadastro() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('cadastroForm').style.display = 'block';
    document.getElementById('recuperarSenhaForm').style.display = 'none';
}

// Função para mostrar o formulário de recuperação de senha
function mostrarRecuperarSenha() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('cadastroForm').style.display = 'none';
    document.getElementById('recuperarSenhaForm').style.display = 'block';
}

// Eventos de login e cadastro
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    login(email, senha);
});

document.getElementById('cadastroForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('cadastroNome').value;
    const email = document.getElementById('cadastroEmail').value;
    const senha = document.getElementById('cadastroSenha').value;
    cadastrar(nome, email, senha);
});

document.getElementById('recuperarSenhaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('recuperarEmail').value;
    recuperarSenha(email);
});

document.getElementById('btnCadastro').addEventListener('click', mostrarCadastro);
document.getElementById('btnVoltarLogin').addEventListener('click', mostrarLogin);
document.getElementById('btnVoltarLoginRecuperar').addEventListener('click', mostrarLogin);
document.getElementById('btnRecuperarSenha').addEventListener('click', mostrarRecuperarSenha);
document.getElementById('btnLogout').addEventListener('click', logout);

// Adiciona evento ao formulário de contas
document.getElementById('contaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    adicionarConta();
});

// Adiciona eventos aos botões de filtro
document.getElementById('filtroTodas').addEventListener('click', () => carregarContas('todas'));
document.getElementById('filtroVencendo').addEventListener('click', () => carregarContas('vencendo'));
document.getElementById('filtroPagas').addEventListener('click', () => carregarContas('pagas'));

// Adiciona evento ao botão de alternar tema
document.getElementById('btnTema').addEventListener('click', alternarTema);

// Adiciona evento ao botão de exportar PDF
document.getElementById('btnExportarPDF').addEventListener('click', exportarParaPDF);

// Adiciona evento ao botão de importar dados
document.getElementById('btnImportarDados').addEventListener('change', importarDados);

// Adiciona evento ao botão de compartilhar conta
document.getElementById('btnCompartilharConta').addEventListener('click', () => {
    const email = prompt('Digite o email do usuário para compartilhar a conta:');
    if (email) {
        const usuario = usuarios.find((u) => u.email === email);
        if (usuario) {
            usuario.contas.push(...usuarioLogado.contas);
            salvarUsuarios();
            alert('Conta compartilhada com sucesso!');
        } else {
            alert('Usuário não encontrado.');
        }
    }
});

// Adiciona evento ao botão de configurar notificações
document.getElementById('btnConfigNotificacoes').addEventListener('click', () => {
    const email = prompt('Digite o email para receber notificações:');
    if (email) {
        localStorage.setItem('emailNotificacoes', email);
        alert('Notificações configuradas com sucesso!');
    }
});

// Carrega o tema ao abrir a página
carregarTema();