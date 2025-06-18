// A URL base da sua API do backend para uso LOCAL.
const API_BASE_URL = 'http://localhost:3000/api';

// --- Lógica de verificação de login no DASHBOARD (executada imediatamente) ---
// Se o usuário tentar acessar dashboard.html diretamente sem userId no localStorage,
// ele é redirecionado para login.html.
if (window.location.pathname.endsWith('dashboard.html')) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        // Interrompe a execução para evitar que o restante do script do dashboard seja executado
        throw new Error("Não logado, redirecionando para a tela de login.");
    }
}

// O restante do script só é executado após o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica para a página de login e cadastro (login.html) ---
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const loginErrorMessage = document.getElementById('loginErrorMessage');
    const registerErrorMessage = document.getElementById('registerErrorMessage');
    const registerSuccessMessage = document.getElementById('registerSuccessMessage');


    // Função para mostrar a seção de cadastro
    const showRegister = (event) => {
        event.preventDefault();
        loginSection.classList.add('hidden');
        loginSection.classList.remove('active');
        registerSection.classList.add('active');
        registerSection.classList.remove('hidden');
        // Ajusta a altura do container para o formulário de cadastro
        document.querySelector('.auth-container').style.height = registerSection.scrollHeight + 'px';
        loginErrorMessage.style.display = 'none'; // Limpa mensagens de erro ao alternar
    };

    // Função para mostrar a seção de login
    const showLogin = (event) => {
        event.preventDefault();
        registerSection.classList.add('hidden');
        registerSection.classList.remove('active');
        loginSection.classList.add('active');
        loginSection.classList.remove('hidden');
        // Ajusta a altura do container para o formulário de login
        document.querySelector('.auth-container').style.height = loginSection.scrollHeight + 'px';
        registerErrorMessage.style.display = 'none'; // Limpa mensagens de erro ao alternar
        registerSuccessMessage.style.display = 'none'; // Limpa mensagens de sucesso ao alternar
    };

    if (loginSection && registerSection) {
        // Inicializa a altura do container com base na seção de login (inicialmente ativa)
        document.querySelector('.auth-container').style.height = loginSection.scrollHeight + 'px';
        loginSection.classList.add('active'); // Garante que login seja a seção inicial ativa
    }


    if (showRegisterLink) showRegisterLink.addEventListener('click', showRegister);
    if (showLoginLink) showLoginLink.addEventListener('click', showLogin);

    // Evento de submit do formulário de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('userId', data.userId); // Salva o userId retornado pelo backend
                    window.location.href = 'dashboard.html'; // Redireciona para o dashboard
                } else {
                    loginErrorMessage.textContent = data.message || 'Erro de login. Verifique suas credenciais.';
                    loginErrorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro ao tentar fazer login:', error);
                loginErrorMessage.textContent = 'Erro de conexão com o servidor. Tente novamente mais tarde.';
                loginErrorMessage.style.display = 'block';
            }
        });
    }

    // Evento de submit do formulário de Cadastro
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                registerErrorMessage.textContent = 'As senhas não coincidem.';
                registerErrorMessage.style.display = 'block';
                registerSuccessMessage.style.display = 'none';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    registerSuccessMessage.textContent = data.message;
                    registerSuccessMessage.style.display = 'block';
                    registerErrorMessage.style.display = 'none';
                    registerForm.reset(); // Limpa o formulário de cadastro
                    // Opcional: redirecionar automaticamente para o login após alguns segundos
                    // setTimeout(() => showLogin(event), 2000);
                } else {
                    registerErrorMessage.textContent = data.message || 'Erro ao tentar cadastrar. Tente novamente.';
                    registerErrorMessage.style.display = 'block';
                    registerSuccessMessage.style.display = 'none';
                }
            } catch (error) {
                console.error('Erro ao tentar cadastrar:', error);
                registerErrorMessage.textContent = 'Erro de conexão com o servidor. Tente novamente mais tarde.';
                registerErrorMessage.style.display = 'block';
                registerSuccessMessage.style.display = 'none';
            }
        });
    }


    // --- Lógica para o Dashboard (dashboard.html) ---
    if (window.location.pathname.endsWith('dashboard.html')) {
        const logoutButton = document.getElementById('logoutButton');
        const incomeForm = document.getElementById('incomeForm');
        const expenseForm = document.getElementById('expenseForm');
        const transactionsTableBody = document.getElementById('transactionsTableBody');
        const totalIncomeElement = document.getElementById('totalIncome');
        const totalExpensesElement = document.getElementById('totalExpenses');
        const currentBalanceElement = document.getElementById('currentBalance');
        const incomeMessage = document.getElementById('incomeMessage');
        const expenseMessage = document.getElementById('expenseMessage');

        // Metas foram removidas do HTML, então suas referências e lógica de atualização foram simplificadas/removidas.
        // const emergencyGoalProgress = document.getElementById('emergencyGoalProgress');
        // ...

        let transactions = [];
        const currentUserId = localStorage.getItem('userId');

        // Função para carregar transações do Backend
        const loadTransactions = async () => {
            try {
                // Requisição GET para o endpoint de transações do usuário logado
                const response = await fetch(`${API_BASE_URL}/transactions/${currentUserId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Erro ao carregar transações: ${response.status}`);
                }
                transactions = await response.json(); // Converte a resposta para JSON
                updateDashboard();
                displayTransactions();
                // A chamada para updateGoalsProgress() foi removida, pois as metas foram retiradas
            } catch (error) {
                console.error('Erro ao carregar transações:', error);
                alert('Não foi possível carregar as transações. Verifique sua conexão ou tente novamente.');
                if (error.message.includes('401')) { // Se for erro de não autenticado
                    localStorage.removeItem('userId');
                    window.location.href = 'login.html';
                }
            }
        };

        // Função para atualizar os totais de Receitas, Despesas e Saldo no Dashboard
        const updateDashboard = () => {
            let totalIncome = 0;
            let totalExpenses = 0;

            transactions.forEach(transaction => {
                if (transaction.type === 'income') {
                    totalIncome += parseFloat(transaction.amount);
                } else if (transaction.type === 'expense') {
                    totalExpenses += parseFloat(transaction.amount);
                }
            });

            const currentBalance = totalIncome - totalExpenses;

            totalIncomeElement.textContent = `R$ ${totalIncome.toFixed(2).replace('.', ',')}`;
            totalExpensesElement.textContent = `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
            currentBalanceElement.textContent = `R$ ${currentBalance.toFixed(2).replace('.', ',')}`;

            if (currentBalance < 0) {
                currentBalanceElement.style.color = '#e74c3c';
            } else {
                currentBalanceElement.style.color = '#2980b9';
            }
            // Chamada para updateGoalsProgress() foi removida
        };

        // Função para exibir as transações na tabela
        const displayTransactions = () => {
            transactionsTableBody.innerHTML = '';

            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedTransactions.forEach(transaction => {
                const row = transactionsTableBody.insertRow();
                row.dataset.id = transaction._id;

                const dateCell = row.insertCell();
                const descriptionCell = row.insertCell();
                const categoryCell = row.insertCell();
                const typeCell = row.insertCell();
                const valueCell = row.insertCell();
                const actionsCell = row.insertCell();

                const [year, month, day] = transaction.date.split('-');
                dateCell.textContent = `${day}/${month}/${year}`;

                descriptionCell.textContent = transaction.description;
                categoryCell.textContent = transaction.category;
                typeCell.textContent = transaction.type === 'income' ? 'Entrada' : 'Saída';
                valueCell.textContent = `R$ ${parseFloat(transaction.amount).toFixed(2).replace('.', ',')}`;

                if (transaction.type === 'income') {
                    typeCell.classList.add('income');
                    valueCell.classList.add('income');
                } else {
                    typeCell.classList.add('expense');
                    valueCell.classList.add('expense');
                }

                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.classList.add('edit-btn');
                editButton.addEventListener('click', () => openEditModal(transaction._id));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Excluir';
                deleteButton.classList.add('delete-btn');
                deleteButton.addEventListener('click', () => deleteTransaction(transaction._id));

                const actionDiv = document.createElement('div');
                actionDiv.classList.add('action-buttons');
                actionDiv.appendChild(editButton);
                actionDiv.appendChild(deleteButton);
                actionsCell.appendChild(actionDiv);
            });
        };

        // Função para deletar uma transação (chamando o Backend)
        const deleteTransaction = async (id) => {
            if (confirm('Tem certeza que deseja excluir esta transação?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/transactions/${id}/${currentUserId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        alert('Transação excluída com sucesso!');
                        loadTransactions();
                    } else {
                        const errorData = await response.json();
                        alert(`Erro ao excluir transação: ${errorData.message}`);
                    }
                } catch (error) {
                    console.error('Erro na requisição DELETE:', error);
                    alert('Erro de conexão ao tentar excluir a transação.');
                }
            }
        };

        // --- Lógica do Modal de Edição ---
        const editModal = document.getElementById('editTransactionModal');
        const closeButton = document.querySelector('#editTransactionModal .close-button');
        const editTransactionForm = document.getElementById('editTransactionForm');
        const editTransactionId = document.getElementById('editTransactionId');
        const editTransactionType = document.getElementById('editTransactionType');
        const editDescription = document.getElementById('editDescription');
        const editAmount = document.getElementById('editAmount');
        const editCategory = document.getElementById('editCategory');
        const editDate = document.getElementById('editDate');
        const editCategoryGroup = document.getElementById('editCategoryGroup');
        const editMessage = document.getElementById('editMessage');

        // Função para abrir o modal de edição
        const openEditModal = (id) => {
            const transactionToEdit = transactions.find(t => t._id === id);
            if (transactionToEdit) {
                editTransactionId.value = transactionToEdit._id;
                editTransactionType.value = transactionToEdit.type;
                editDescription.value = transactionToEdit.description;
                editAmount.value = transactionToEdit.amount;
                editDate.value = transactionToEdit.date;

                if (transactionToEdit.type === 'expense') {
                    editCategoryGroup.style.display = 'block';
                    editCategory.value = transactionToEdit.category;
                } else {
                    editCategoryGroup.style.display = 'none';
                    editCategory.value = 'Receita';
                }

                editMessage.style.display = 'none';
                editModal.style.display = 'block';
            }
        };

        // Função para fechar o modal
        const closeEditModal = () => {
            editModal.style.display = 'none';
        };

        // Evento para salvar as alterações do modal (chamando o Backend)
        if (editTransactionForm) {
            editTransactionForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const id = editTransactionId.value;
                const type = editTransactionType.value;
                const description = editDescription.value;
                const amount = parseFloat(editAmount.value);
                const category = editCategory.value;
                const date = editDate.value;

                if (isNaN(amount) || amount <= 0) {
                    editMessage.textContent = 'Por favor, insira um valor válido para o valor.';
                    editMessage.classList.remove('success-message');
                    editMessage.classList.add('error-message');
                    editMessage.style.display = 'block';
                    return;
                }
                if (type === 'expense' && category === "") {
                    editMessage.textContent = 'Por favor, selecione uma categoria para a despesa.';
                    editMessage.classList.remove('success-message');
                    editMessage.classList.add('error-message');
                    editMessage.style.display = 'block';
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            description, amount, date, type,
                            category: type === 'expense' ? category : 'Receita',
                            userId: currentUserId
                        })
                    });

                    if (response.ok) {
                        alert('Transação atualizada com sucesso!');
                        closeEditModal();
                        loadTransactions();
                    } else {
                        const errorData = await response.json();
                        editMessage.textContent = errorData.message || 'Erro ao salvar alterações.';
                        editMessage.classList.remove('success-message');
                        editMessage.classList.add('error-message');
                        editMessage.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Erro na requisição PUT:', error);
                    editMessage.textContent = 'Erro de conexão. Não foi possível salvar.';
                    editMessage.classList.remove('success-message');
                    editMessage.classList.add('error-message');
                    editMessage.style.display = 'block';
                }
            });
        }

        // Eventos para fechar o modal
        if (closeButton) closeButton.addEventListener('click', closeEditModal);
        window.addEventListener('click', (event) => {
            if (event.target === editModal) {
                closeEditModal();
            }
        });


        // Evento de Logout
        if (logoutButton) {
            logoutButton.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('userId');
                window.location.href = 'login.html';
            });
        }

        // Evento para adicionar receita (chamando o Backend)
        if (incomeForm) {
            incomeForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const description = document.getElementById('incomeDescription').value;
                const amount = parseFloat(document.getElementById('incomeAmount').value);
                const date = document.getElementById('incomeDate').value;

                if (isNaN(amount) || amount <= 0) {
                    incomeMessage.textContent = 'Por favor, insira um valor válido para a receita.';
                    incomeMessage.classList.remove('success-message');
                    incomeMessage.classList.add('error-message');
                    incomeMessage.style.display = 'block';
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            description, amount, date, type: 'income', category: 'Receita', userId: currentUserId
                        })
                    });

                    if (response.ok) {
                        incomeMessage.textContent = 'Receita adicionada com sucesso!';
                        incomeMessage.classList.remove('error-message');
                        incomeMessage.classList.add('success-message');
                        incomeMessage.style.display = 'block';
                        incomeForm.reset();
                        loadTransactions();
                    } else {
                        const errorData = await response.json();
                        incomeMessage.textContent = errorData.message || 'Erro ao adicionar receita.';
                        incomeMessage.classList.remove('success-message');
                        incomeMessage.classList.add('error-message');
                        incomeMessage.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Erro na requisição POST de receita:', error);
                    incomeMessage.textContent = 'Erro de conexão. Não foi possível adicionar a receita.';
                    incomeMessage.classList.remove('success-message');
                    incomeMessage.classList.add('error-message');
                    incomeMessage.style.display = 'block';
                }

                setTimeout(() => { incomeMessage.style.display = 'none'; }, 3000);
            });
        }

        // Evento para adicionar despesa (chamando o Backend)
        if (expenseForm) {
            expenseForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const description = document.getElementById('expenseDescription').value;
                const amount = parseFloat(document.getElementById('expenseAmount').value);
                const category = document.getElementById('expenseCategory').value;
                const date = document.getElementById('expenseDate').value;

                if (isNaN(amount) || amount <= 0) {
                    expenseMessage.textContent = 'Por favor, insira um valor válido para a despesa.';
                    expenseMessage.classList.remove('success-message');
                    expenseMessage.classList.add('error-message');
                    expenseMessage.style.display = 'block';
                    return;
                }

                if (category === "") {
                    expenseMessage.textContent = 'Por favor, selecione uma categoria para a despesa.';
                    expenseMessage.classList.remove('success-message');
                    expenseMessage.classList.add('error-message');
                    expenseMessage.style.display = 'block';
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            description, amount, date, type: 'expense', category: category, userId: currentUserId
                        })
                    });

                    if (response.ok) {
                        expenseMessage.textContent = 'Despesa adicionada com sucesso!';
                        expenseMessage.classList.remove('error-message');
                        expenseMessage.classList.add('success-message');
                        expenseMessage.style.display = 'block';
                        expenseForm.reset();
                        loadTransactions();
                    } else {
                        const errorData = await response.json();
                        expenseMessage.textContent = errorData.message || 'Erro ao adicionar despesa.';
                        expenseMessage.classList.remove('success-message');
                        expenseMessage.classList.add('error-message');
                        expenseMessage.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Erro na requisição POST de despesa:', error);
                    expenseMessage.textContent = 'Erro de conexão. Não foi possível adicionar a despesa.';
                    expenseMessage.classList.remove('success-message');
                    expenseMessage.classList.add('error-message');
                    expenseMessage.style.display = 'block';
                }

                setTimeout(() => { expenseMessage.style.display = 'none'; }, 3000);
            });
        }

        // Carrega as transações ao entrar no dashboard
        loadTransactions();
    }
});