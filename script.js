document.addEventListener("DOMContentLoaded", () => {
    const formContas = document.getElementById("form-contas");
    const listaContas = document.getElementById("lista-contas");
    const formCartoes = document.getElementById("form-cartoes");
    const listaCartoes = document.getElementById("lista-cartoes");
    const totalGastos = document.getElementById("total-gastos");
    const gastosMensais = document.getElementById("gastos-mensais");

    let contas = JSON.parse(localStorage.getItem("contas")) || [];
    let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
    let total = 0;
// Função para atualizar lista de contas
function atualizarListaContas() {
    listaContas.innerHTML = "";
    total = 0;

    const categorias = {};

    contas.forEach((conta) => {
        const li = document.createElement("li");
        li.textContent = `${conta.nome} - R$ ${conta.valor.toFixed(2)} (${conta.categoria})`;
        listaContas.appendChild(li);

        total += conta.valor;

        // Agrupar por categoria
        if (!categorias[conta.categoria]) {
            categorias[conta.categoria] = 0;
        }
        categorias[conta.categoria] += conta.valor;
    });

    totalGastos.textContent = total.toFixed(2);
    gastosMensais.textContent = total.toFixed(2);
    localStorage.setItem("contas", JSON.stringify(contas));

    // Atualizar gráfico
    atualizarGrafico(categorias);
}

// Função para atualizar lista de cartões
function atualizarListaCartoes() {
    listaCartoes.innerHTML = "";

    const categorias = {};

    cartoes.forEach((cartao) => {
        const li = document.createElement("li");
        li.textContent = `${cartao.nome} - R$ ${cartao.valor.toFixed(2)} (${cartao.categoria})`;
        listaCartoes.appendChild(li);

        total += cartao.valor;

        // Agrupar por categoria
        if (!categorias[cartao.categoria]) {
            categorias[cartao.categoria] = 0;
        }
        categorias[cartao.categoria] += cartao.valor;
    });

    totalGastos.textContent = total.toFixed(2);
    gastosMensais.textContent = total.toFixed(2);
    localStorage.setItem("cartoes", JSON.stringify(cartoes));

    // Atualizar gráfico
    atualizarGrafico(categorias);
}

// Função para atualizar gráfico com categorias
function atualizarGrafico(categorias) {
    const ctx = document.getElementById("grafico-gastos").getContext("2d");

    const labels = Object.keys(categorias);
    const valores = Object.values(categorias);

    if (window.grafico) {
        window.grafico.destroy();
    }

    window.grafico = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Gastos por Categoria",
                    data: valores,
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                    borderColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
        },
    });
}

    formContas.addEventListener("submit", (e) => {
        e.preventDefault();

        const nome = document.getElementById("nome-conta").value;
        const valor = parseFloat(document.getElementById("valor-conta").value);
        const vencimento = document.getElementById("vencimento-conta").value;

        if (nome && valor && vencimento) {
            contas.push({ nome, valor, vencimento });
            atualizarListaContas();
            formContas.reset();
        }
    });

    formCartoes.addEventListener("submit", (e) => {
        e.preventDefault();

        const nome = document.getElementById("nome-cartao").value;
        const valor = parseFloat(document.getElementById("valor-fatura").value);
        const vencimento = document.getElementById("vencimento-fatura").value;

        if (nome && valor && vencimento) {
            cartoes.push({ nome, valor, vencimento });
            atualizarListaCartoes();
            formCartoes.reset();
        }
    });

    atualizarListaContas();
    atualizarListaCartoes();
});

function verificarVencimentos() {
    const hoje = new Date();
    const notificacoes = [];

    contas.forEach((conta) => {
        const vencimento = new Date(conta.vencimento);
        const diffTime = vencimento - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays >= 0) {
            notificacoes.push(`A conta "${conta.nome}" vence em ${diffDays} dias.`);
        }
    });

    cartoes.forEach((cartao) => {
        const vencimento = new Date(cartao.vencimento);
        const diffTime = vencimento - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays >= 0) {
            notificacoes.push(`A fatura do cartão "${cartao.nome}" vence em ${diffDays} dias.`);
        }
    });

    if (notificacoes.length > 0) {
        alert("Notificações de Vencimentos:\n" + notificacoes.join("\n"));
    }
}

// Verificar vencimentos ao carregar a página
verificarVencimentos();

function atualizarGrafico() {
    const ctx = document.getElementById("grafico-gastos").getContext("2d");

    const categorias = ["Contas", "Cartões"];
    const valores = [
        contas.reduce((sum, conta) => sum + conta.valor, 0),
        cartoes.reduce((sum, cartao) => sum + cartao.valor, 0),
    ];

    if (window.grafico) {
        window.grafico.destroy();
    }

    window.grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: categorias,
            datasets: [
                {
                    label: "Gastos por Categoria",
                    data: valores,
                    backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 99, 132, 0.2)"],
                    borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

atualizarGrafico();

const toggleDarkMode = document.getElementById("toggle-dark-mode");

toggleDarkMode.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});