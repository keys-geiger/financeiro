require('dotenv').config(); // Carrega variáveis de ambiente do .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Necessário para servir arquivos estáticos

const app = express();
const port = process.env.PORT || 3000;

// Conexão com MongoDB Atlas
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri)
    .then(() => console.log('Conectado ao MongoDB Atlas!'))
    .catch(err => console.error('Erro de conexão ao MongoDB:', err));

// Definindo o Schema e Modelo para Usuários
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true } // EM PRODUÇÃO: HASH AQUI!
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Definindo o Schema e Modelo para Transações
const transactionSchema = new mongoose.Schema({
    description: String,
    amount: Number,
    date: String,
    type: String, // 'income' ou 'expense'
    category: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
const Transaction = mongoose.model('Transaction', transactionSchema);

// Middleware
// CORS configurado para permitir todas as origens para desenvolvimento local.
// EM PRODUÇÃO: Altere '*' para a URL exata do seu frontend (ex: 'https://seu-frontend.onrender.com')
app.use(cors({
    origin: '*'
}));
app.use(express.json()); // Habilita o Express a ler JSON no corpo das requisições

// --- Rotas da API ---

// Rota de Cadastro de Usuário
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        const newUser = new User({ email, password }); // EM PRODUÇÃO: HASH DA SENHA ANTES DE SALVAR!
        await newUser.save();
        res.status(201).json({ success: true, message: 'Conta criada com sucesso! Você pode fazer login agora.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao registrar usuário: ' + err.message });
    }
});

// Rota de Login (verificando no banco de dados)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }

        // EM PRODUÇÃO: Comparar a senha fornecida com a senha hashed do banco!
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }

        res.json({ success: true, message: 'Login bem-sucedido!', userId: user._id });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao fazer login: ' + err.message });
    }
});

// Rota para Obter Transações de um Usuário
app.get('/api/transactions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'UserId inválido.' });
        }
        const transactions = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota para Adicionar Nova Transação
app.post('/api/transactions', async (req, res) => {
    const { description, amount, date, type, category, userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'UserId inválido ou ausente.' });
    }

    const newTransaction = new Transaction({
        description, amount, date, type, category, userId: new mongoose.Types.ObjectId(userId)
    });
    try {
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota para Atualizar Transação Existente
app.put('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { description, amount, date, type, category, userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'UserId inválido ou ausente.' });
    }

    try {
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: id, userId: new mongoose.Types.ObjectId(userId) },
            { description, amount, date, type, category },
            { new: true }
        );
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transação não encontrada ou não pertence a este usuário.' });
        }
        res.json(updatedTransaction);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota para Deletar Transação
app.delete('/api/transactions/:id/:userId', async (req, res) => {
    const { id, userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'UserId inválido ou ausente.' });
    }

    try {
        const deletedTransaction = await Transaction.findOneAndDelete({ _id: id, userId: new mongoose.Types.ObjectId(userId) });
        if (!deletedTransaction) {
            return res.status(404).json({ message: 'Transação não encontrada ou não pertence a este usuário.' });
        }
        res.json({ message: 'Transação deletada com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ######################################################################################
// SERVINDO ARQUIVOS ESTÁTICOS DO FRONTEND
// Essas linhas devem vir DEPOIS de todas as rotas da API (que começam com /api)
// para garantir que as requisições da API sejam processadas primeiro.
// ######################################################################################

// Redirecionamento da raiz para a página de login
app.get('/', (req, res) => {
    res.redirect('/login.html'); // Redireciona para o login.html que será servido abaixo
});

// Configura o Express para servir arquivos estáticos da pasta 'frontend'
// Isso assume que sua pasta 'frontend' está no mesmo nível que sua pasta 'backend'.
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota de fallback para Single Page Applications (SPAs)
// ou para servir o arquivo HTML principal para qualquer rota não tratada.
// IMPORTANTE: Isso deve ser a ÚLTIMA ROTA no seu servidor.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});


// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});