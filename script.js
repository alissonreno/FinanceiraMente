document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabs = document.querySelectorAll('nav button[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Desativa a aba ativa atual
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Ativa a aba clicada
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Theme Toggle
    const themeToggle = document.getElementById('toggle-theme');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
        });
    }

    // Modal - Add Account
    const addAccountBtn = document.getElementById('add-account-btn');
    const addAccountModal = document.getElementById('add-account-modal');
    if (addAccountBtn && addAccountModal) {
        const closeAccountModalBtn = addAccountModal.querySelector('.close-button');

        addAccountBtn.addEventListener('click', () => {
            addAccountModal.style.display = "block";
        });

        closeAccountModalBtn.addEventListener('click', () => {
            addAccountModal.style.display = "none";
        });

        window.addEventListener('click', (event) => {
            if (event.target == addAccountModal) {
                addAccountModal.style.display = "none";
            }
        });
    }

    // Modal - Add Goal
    const addGoalBtn = document.getElementById('add-goal-btn');
    const addGoalModal = document.getElementById('add-goal-modal');
    if (addGoalBtn && addGoalModal) {
        const closeGoalModalBtn = addGoalModal.querySelector('.close-button');

        addGoalBtn.addEventListener('click', () => {
            addGoalModal.style.display = "block";
        });

        closeGoalModalBtn.addEventListener('click', () => {
            addGoalModal.style.display = "none";
        });

        window.addEventListener('click', (event) => {
            if (event.target == addGoalModal) {
                addGoalModal.style.display = "none";
            }
        });
    }

    // Account Saving
    const saveAccountBtn = document.getElementById('save-account-btn');
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener('click', () => {
            const accountName = document.getElementById('account-name').value;
            const accountValue = document.getElementById('account-value').value;
            let accountDueDate = document.getElementById('account-due-date').value; // dd/mm/yyyy
            const accountCategory = document.getElementById('account-category').value;

            // Basic validation
            if (!accountName || !accountValue || !accountDueDate) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            const account = {
                name: accountName,
                value: accountValue,
                dueDate: accountDueDate,
                category: accountCategory,
                paid: false // Initial state
            };

            saveAccount(account);
            addAccountModal.style.display = 'none';
        });
    }

    // Goal Saving
    const saveGoalBtn = document.getElementById('save-goal-btn');
    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', () => {
            const goalName = document.getElementById('goal-name').value;
            const goalValue = document.getElementById('goal-value').value;
            let goalCompletionDate = document.getElementById('goal-completion-date').value; //dd/mm/yyyy

            // Basic validation
            if (!goalName || !goalValue || !goalCompletionDate) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            const goal = {
                name: goalName,
                value: goalValue,
                completionDate: goalCompletionDate,
            };

            saveGoal(goal);
            addGoalModal.style.display = 'none';
            displayGoalProgressChart(); // Update chart after saving a goal
        });
    }

    // Data Storage
    function saveAccount(account) {
        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        accounts.push(account);
        localStorage.setItem('accounts', JSON.stringify(accounts));
        displayAccounts(); // Refresh the list
    }

    function saveGoal(goal) {
        let goals = JSON.parse(localStorage.getItem('goals')) || [];
        goals.push(goal);
        localStorage.setItem('goals', JSON.stringify(goals));
        displayGoals(); // Refresh the list
    }

    function displayAccounts() {
        const accountsList = document.getElementById('accounts-list');
        if (!accountsList) return;
        accountsList.innerHTML = ''; // Clear existing list

        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

        // Apply filters
        const categoryFilter = document.getElementById('account-filter-category').value;
        const statusFilter = document.getElementById('account-filter-status').value;

        let filteredAccounts = accounts;

        if (categoryFilter !== 'todas') {
            filteredAccounts = filteredAccounts.filter(account => account.category === categoryFilter);
        }

        if (statusFilter === 'vencendo') {
            filteredAccounts = filteredAccounts.filter(account => {
                const dueDate = parseDate(account.dueDate);
                const now = new Date();
                const timeDiff = dueDate.getTime() - now.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                return daysLeft <= 7 && !account.paid;
            });
        } else if (statusFilter === 'pagas') {
            filteredAccounts = filteredAccounts.filter(account => account.paid);
        }

        filteredAccounts.forEach(account => {
            const accountDiv = document.createElement('div');
            accountDiv.classList.add('account-item');
            if (account.paid) {
                accountDiv.classList.add('paid');
            }

            let categoryIcon = '';
            switch (account.category) {
                case 'água':
                    categoryIcon = '<i class="fas fa-tint"></i>';
                    break;
                case 'luz':
                    categoryIcon = '<i class="fas fa-lightbulb"></i>';
                    break;
                case 'aluguel':
                    categoryIcon = '<i class="fas fa-home"></i>';
                    break;
                default:
                    categoryIcon = '<i class="fas fa-question"></i>';
                    break;
            }

            accountDiv.innerHTML = `
                ${categoryIcon}
                <p>Nome: ${account.name}</p>
                <p>Valor: ${account.value}</p>
                <p>Vencimento: ${account.dueDate}</p>
                <p>Categoria: ${account.category}</p>
                <button class="delete-account" data-name="${account.name}">Excluir</button>
                <button class="mark-paid" data-name="${account.name}">${account.paid ? 'Marcar como Não Paga' : 'Marcar como Paga'}</button>
            `;
            accountsList.appendChild(accountDiv);
        });

        // Add event listeners to the delete buttons
        document.querySelectorAll('.delete-account').forEach(button => {
            button.addEventListener('click', function () {
                const accountName = this.dataset.name;
                deleteAccount(accountName);
            });
        });

        // Add event listeners to the mark as paid buttons
        document.querySelectorAll('.mark-paid').forEach(button => {
            button.addEventListener('click', function () {
                const accountName = this.dataset.name;
                markAccountAsPaid(accountName);
            });
        });
    }

    function displayGoals() {
        const goalsList = document.getElementById('goals-list');
        if (!goalsList) return;
        goalsList.innerHTML = ''; // Clear existing list

        let goals = JSON.parse(localStorage.getItem('goals')) || [];
        goals.forEach(goal => {
            const goalDiv = document.createElement('div');

            // Calculate savings per week and month
            const completionDate = parseDate(goal.completionDate); // Parse dd/mm/yyyy to Date
            const now = new Date();
            const timeDiff = completionDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const weeksLeft = daysLeft / 7;
            const monthsLeft = daysLeft / 30;
            const savingsPerWeek = (goal.value / weeksLeft).toFixed(2);
            const savingsPerMonth = (goal.value / monthsLeft).toFixed(2);

            goalDiv.innerHTML = `
                <p>Nome: ${goal.name}</p>
                <p>Valor: ${goal.value}</p>
                <p>Data de Conclusão: ${goal.completionDate}</p>
                <p>Economia por Semana: ${savingsPerWeek}</p>
                <p>Economia por Mês: ${savingsPerMonth}</p>
                <button class="delete-goal" data-name="${goal.name}">Excluir</button>
            `;
            goalsList.appendChild(goalDiv);
        });

        // Add event listeners to the delete buttons
        document.querySelectorAll('.delete-goal').forEach(button => {
            button.addEventListener('click', function () {
                const goalName = this.dataset.name;
                deleteGoal(goalName);
            });
        });
    }

    function deleteAccount(accountName) {
        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        accounts = accounts.filter(account => account.name !== accountName);
        localStorage.setItem('accounts', JSON.stringify(accounts));
        displayAccounts(); // Refresh the list
    }

    function deleteGoal(goalName) {
        let goals = JSON.parse(localStorage.getItem('goals')) || [];
        goals = goals.filter(goal => goal.name !== goalName);
        localStorage.setItem('goals', JSON.stringify(goals));
        displayGoals(); // Refresh the list
    }

    function markAccountAsPaid(accountName) {
        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const accountIndex = accounts.findIndex(account => account.name === accountName);
        if (accountIndex !== -1) {
            accounts[accountIndex].paid = !accounts[accountIndex].paid; // Toggle paid status
            localStorage.setItem('accounts', JSON.stringify(accounts));
            displayAccounts(); // Refresh the list
        }
    }

    function formatDate(dateString) {
        const parts = dateString.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // yyyy-mm-dd
    }

    function parseDate(dateString) {
        const parts = dateString.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]); // year, month (0-based), day
    }

    // Login/Register functionality
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    if (loginBtn && registerBtn && loginModal && registerModal) {
        const loginCloseBtn = loginModal.querySelector('.close-button');
        const registerCloseBtn = registerModal.querySelector('.close-button');

        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'block';
        });

        registerBtn.addEventListener('click', () => {
            registerModal.style.display = 'block';
        });

        loginCloseBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });

        registerCloseBtn.addEventListener('click', () => {
            registerModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == loginModal) {
                loginModal.style.display = 'none';
            }
            if (event.target == registerModal) {
                registerModal.style.display = 'none';
            }
        });

        const loginSubmitBtn = document.getElementById('login-submit-btn');
        const registerSubmitBtn = document.getElementById('register-submit-btn');

        loginSubmitBtn.addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            // Simulate login
            if (email === 'test@example.com' && password === 'password') {
                // Simulate JWT token
                const token = 'simulated_jwt_token';
                localStorage.setItem('token', token);
                alert('Login successful!');
                loginModal.style.display = 'none';
            } else {
                alert('Invalid credentials.');
            }
        });

        registerSubmitBtn.addEventListener('click', () => {
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            // Validation
            if (!validateEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
                alert('Password must be at least 6 characters long and contain letters and numbers.');
                return;
            }

            // Simulate registration
            alert('Registration successful!');
            registerModal.style.display = 'none';
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Event listeners for account filters
    document.getElementById('account-filter-category').addEventListener('change', displayAccounts);
    document.getElementById('account-filter-status').addEventListener('change', displayAccounts);

    // Report Generation (basic)
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            const period = document.getElementById('report-period').value;
            generateReport(period);
        });
    }

    function generateReport(period) {
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const reportOutput = document.getElementById('report-output');
        let totalExpenses = 0;

        const now = new Date();
        let startDate;

        if (period === '7') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === '30') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }

        const recentExpenses = accounts.filter(account => {
            const dueDate = parseDate(account.dueDate);
            return dueDate >= startDate && dueDate <= now;
        });

        recentExpenses.forEach(account => {
            totalExpenses += parseFloat(account.value);
        });

        reportOutput.innerHTML = `<p>Total de Despesas nos últimos ${period} dias: R$ ${totalExpenses.toFixed(2)}</p>`;
    }

    function displayGoalProgressChart() {
        const goals = JSON.parse(localStorage.getItem('goals')) || [];
        if (goals.length === 0) return; // Don't display chart if there are no goals

        const goal = goals[0]; // For simplicity, display progress of the first goal
        const completionDate = parseDate(goal.completionDate);
        const now = new Date();
        const timeDiff = completionDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const weeksLeft = daysLeft / 7;

        const savedAmount = 50; // Example saved amount

        const chartCanvas = document.getElementById('goal-progress-chart');
        if (!chartCanvas) return;

        const chart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: ['Progresso da Meta'],
                datasets: [{
                    label: 'Valor Economizado',
                    data: [savedAmount],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: parseInt(goal.value)
                    }
                }
            }
        });
    }

    // Initial Display
    displayAccounts();
    displayGoals();
    displayGoalProgressChart();
});