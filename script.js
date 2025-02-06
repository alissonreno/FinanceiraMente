// Configuração do Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Função de Login
function login(email, senha) {
    auth.signInWithEmailAndPassword(email, senha)
        .then(() => alert("Login realizado com sucesso!"))
        .catch((error) => alert("Erro ao fazer login: " + error.message));
}

// Função de Registro
function registrar(email, senha) {
    auth.createUserWithEmailAndPassword(email, senha)
        .then(() => alert("Conta criada com sucesso!"))
        .catch((error) => alert("Erro ao criar conta: " + error.message));
}

// Função para salvar dados no Firestore
function salvarDados(renda, gastos, meta) {
    const user = auth.currentUser;
    if (user) {
        db.collection("usuarios").doc(user.uid).set({
            renda: renda,
            gastos: gastos,
            meta: meta
        }).then(() => alert("Dados salvos com sucesso!"))
          .catch((error) => alert("Erro ao salvar dados: " + error.message));
    } else {
        alert("Faça login para salvar seus dados.");
    }
}

// Função para calcular finanças
function calcularFinancas() {
    const renda = parseFloat(document.getElementById('renda').value) || 0;
    const gastos = parseFloat(document.getElementById('gastos').value) || 0;
    const meta = parseFloat(document.getElementById('meta').value) || 0;

    const saldo = renda - gastos;
    const economia = saldo >= meta ? "Você alcançou sua meta!" : "Faltam R$" + (meta - saldo).toFixed(2) + " para alcançar sua meta.";

    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
        <p><strong>Saldo Mensal:</strong> R$${saldo.toFixed(2)}</p>
        <p>${economia}</p>
    `;

    // Salvar no localStorage
    localStorage.setItem('renda', renda);
    localStorage.setItem('gastos', gastos);
    localStorage.setItem('meta', meta);

    // Atualizar o gráfico
    atualizarGrafico(renda, gastos, saldo);

    // Salvar no Firestore
    salvarDados(renda, gastos, meta);
}

// Função para atualizar o gráfico
function atualizarGrafico(renda, gastos, saldo) {
    const ctx = document.getElementById('financasChart').getContext('2d');
    const financasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Renda', 'Gastos', 'Saldo'],
            datasets: [{
                label: 'Valores (R$)',
                data: [renda, gastos, saldo],
                backgroundColor: ['#2ecc71', '#e74c3c', '#3498db'],
                borderColor: ['#27ae60', '#c0392b', '#2980b9'],
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

// Carregar dados do localStorage ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const rendaSalva = localStorage.getItem('renda');
    const gastosSalvos = localStorage.getItem('gastos');
    const metaSalva = localStorage.getItem('meta');

    if (rendaSalva) document.getElementById('renda').value = rendaSalva;
    if (gastosSalvos) document.getElementById('gastos').value = gastosSalvos;
    if (metaSalva) document.getElementById('meta').value = metaSalva;
});

// Exportar relatório para PDF
document.getElementById('exportarPDF').addEventListener('click', () => {
    const renda = parseFloat(document.getElementById('renda').value) || 0;
    const gastos = parseFloat(document.getElementById('gastos').value) || 0;
    const meta = parseFloat(document.getElementById('meta').value) || 0;
    const saldo = renda - gastos;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório Financeiro", 10, 10);
    doc.text(`Renda Mensal: R$${renda.toFixed(2)}`, 10, 20);
    doc.text(`Gastos Mensais: R$${gastos.toFixed(2)}`, 10, 30);
    doc.text(`Saldo Mensal: R$${saldo.toFixed(2)}`, 10, 40);
    doc.text(`Meta de Economia: R$${meta.toFixed(2)}`, 10, 50);
    doc.save("relatorio_financeiro.pdf");
});