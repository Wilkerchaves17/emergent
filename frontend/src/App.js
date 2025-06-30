import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  Menu, 
  X, 
  Home, 
  PlusCircle, 
  BarChart3, 
  Target, 
  Tags, 
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Calendar,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const INITIAL_CATEGORIES = [
  { id: '1', name: 'Alimentação', type: 'expense', color: '#ef4444' },
  { id: '2', name: 'Transporte', type: 'expense', color: '#f97316' },
  { id: '3', name: 'Moradia', type: 'expense', color: '#eab308' },
  { id: '4', name: 'Lazer', type: 'expense', color: '#22c55e' },
  { id: '5', name: 'Salário', type: 'income', color: '#3b82f6' },
  { id: '6', name: 'Freelance', type: 'income', color: '#8b5cf6' },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [goals, setGoals] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    color: '#ef4444'
  });

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    const savedCategories = localStorage.getItem('categories');
    const savedGoals = localStorage.getItem('goals');

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      localStorage.setItem('categories', JSON.stringify(INITIAL_CATEGORIES));
    }
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  // Transaction functions
  const handleSubmitTransaction = (e) => {
    e.preventDefault();
    
    if (!transactionForm.description || !transactionForm.amount || !transactionForm.category) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      ...transactionForm,
      amount: parseFloat(transactionForm.amount)
    };

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? transaction : t));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [...prev, transaction]);
    }

    setTransactionForm({
      description: '',
      amount: '',
      category: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditTransaction = (transaction) => {
    setTransactionForm({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type,
      date: transaction.date
    });
    setEditingTransaction(transaction);
    setActiveSection('transactions');
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Category functions
  const handleSubmitCategory = (e) => {
    e.preventDefault();
    
    if (!categoryForm.name) {
      alert('Por favor, insira o nome da categoria');
      return;
    }

    const category = {
      id: editingCategory?.id || Date.now().toString(),
      ...categoryForm
    };

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? category : c));
      // Update transactions that use this category
      setTransactions(prev => prev.map(t => 
        t.category === editingCategory.name 
          ? { ...t, category: category.name }
          : t
      ));
      setEditingCategory(null);
    } else {
      // Check if category already exists
      if (categories.some(c => c.name.toLowerCase() === categoryForm.name.toLowerCase())) {
        alert('Esta categoria já existe');
        return;
      }
      setCategories(prev => [...prev, category]);
    }

    setCategoryForm({
      name: '',
      type: 'expense',
      color: '#ef4444'
    });
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setEditingCategory(category);
  };

  const handleDeleteCategory = (id) => {
    const category = categories.find(c => c.id === id);
    const isUsed = transactions.some(t => t.category === category.name);
    
    if (isUsed) {
      alert('Esta categoria não pode ser excluída pois está sendo usada em transações');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  // Goal functions
  const handleSubmitGoal = (e) => {
    e.preventDefault();
    
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.endDate) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const goal = {
      id: editingGoal?.id || Date.now().toString(),
      ...goalForm,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: parseFloat(goalForm.currentAmount) || 0
    };

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? goal : g));
      setEditingGoal(null);
    } else {
      setGoals(prev => [...prev, goal]);
    }

    setGoalForm({
      name: '',
      targetAmount: '',
      currentAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

  const handleEditGoal = (goal) => {
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      startDate: goal.startDate,
      endDate: goal.endDate
    });
    setEditingGoal(goal);
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const calculateMonthlySavingsNeeded = (goal) => {
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    
    if (monthsDiff <= 0) return 0;
    
    const remaining = goal.targetAmount - goal.currentAmount;
    return remaining / monthsDiff;
  };

  // Chart data
  const getExpensesByCategory = () => {
    const expenseCategories = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
      });
    return expenseCategories;
  };

  const getIncomeByCategory = () => {
    const incomeCategories = {};
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
      });
    return incomeCategories;
  };

  const expenseChartData = {
    labels: Object.keys(getExpensesByCategory()),
    datasets: [{
      data: Object.values(getExpensesByCategory()),
      backgroundColor: Object.keys(getExpensesByCategory()).map(cat => 
        categories.find(c => c.name === cat)?.color || '#ef4444'
      ),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const incomeChartData = {
    labels: Object.keys(getIncomeByCategory()),
    datasets: [{
      data: Object.values(getIncomeByCategory()),
      backgroundColor: Object.keys(getIncomeByCategory()).map(cat => 
        categories.find(c => c.name === cat)?.color || '#3b82f6'
      ),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const comparisonChartData = {
    labels: ['Receitas', 'Despesas'],
    datasets: [{
      data: [getTotalIncome(), getTotalExpenses()],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Filter transactions by date
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      if (filterStartDate && t.date < filterStartDate) return false;
      if (filterEndDate && t.date > filterEndDate) return false;
      return true;
    });
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const filteredTransactions = getFilteredTransactions();
    
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: ${filterStartDate || 'Início'} até ${filterEndDate || 'Fim'}`, 20, 35);
    
    let y = 50;
    doc.text('Transações:', 20, y);
    y += 10;
    
    filteredTransactions.forEach(t => {
      const text = `${t.date} - ${t.description} - ${t.category} - ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`;
      doc.text(text, 20, y);
      y += 7;
      
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    doc.save('relatorio-financeiro.pdf');
  };

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'transactions', icon: PlusCircle, label: 'Transações' },
    { id: 'charts', icon: BarChart3, label: 'Gráficos' },
    { id: 'goals', icon: Target, label: 'Metas' },
    { id: 'categories', icon: Tags, label: 'Categorias' },
    { id: 'reports', icon: FileText, label: 'Relatórios' },
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>💰 FinanceControl</h2>
          <button 
            className="sidebar-toggle desktop-hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <button 
            className="sidebar-toggle mobile-only"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <h1>Controle Financeiro Pessoal</h1>
        </header>

        <main className="content">
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="dashboard">
              <div className="stats-grid">
                <div className="stat-card income">
                  <div className="stat-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>Receitas</h3>
                    <p className="stat-value">{formatCurrency(getTotalIncome())}</p>
                  </div>
                </div>
                
                <div className="stat-card expense">
                  <div className="stat-icon">
                    <TrendingDown size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>Despesas</h3>
                    <p className="stat-value">{formatCurrency(getTotalExpenses())}</p>
                  </div>
                </div>
                
                <div className={`stat-card ${getBalance() >= 0 ? 'positive' : 'negative'}`}>
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>Saldo</h3>
                    <p className="stat-value">{formatCurrency(getBalance())}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-content">
                <div className="recent-transactions">
                  <h3>Transações Recentes</h3>
                  <div className="transaction-list">
                    {transactions.slice(-5).reverse().map(transaction => (
                      <div key={transaction.id} className="transaction-item">
                        <div className="transaction-info">
                          <span className="transaction-description">{transaction.description}</span>
                          <span className="transaction-category">{transaction.category}</span>
                        </div>
                        <span className={`transaction-amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="goals-overview">
                  <h3>Progresso das Metas</h3>
                  {goals.map(goal => (
                    <div key={goal.id} className="goal-progress">
                      <div className="goal-info">
                        <span className="goal-name">{goal.name}</span>
                        <span className="goal-percentage">
                          {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          {activeSection === 'transactions' && (
            <div className="transactions-section">
              <div className="section-header">
                <h2>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h2>
              </div>

              <form onSubmit={handleSubmitTransaction} className="transaction-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Descrição *</label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ex: Supermercado, Salário..."
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Valor *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value, category: '' }))}
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories
                        .filter(cat => cat.type === transactionForm.type)
                        .map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Data *</label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingTransaction ? 'Atualizar' : 'Adicionar'} Transação
                  </button>
                  {editingTransaction && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingTransaction(null);
                        setTransactionForm({
                          description: '',
                          amount: '',
                          category: '',
                          type: 'expense',
                          date: new Date().toISOString().split('T')[0]
                        });
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="transactions-list">
                <h3>Todas as Transações</h3>
                <div className="table-container">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(transaction => (
                        <tr key={transaction.id}>
                          <td>{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                          <td>{transaction.description}</td>
                          <td>{transaction.category}</td>
                          <td>
                            <span className={`type-badge ${transaction.type}`}>
                              {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className={`amount ${transaction.type}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                onClick={() => handleEditTransaction(transaction)}
                                className="btn-icon"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="btn-icon delete"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {activeSection === 'charts' && (
            <div className="charts-section">
              <div className="section-header">
                <h2>Gráficos e Análises</h2>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Despesas por Categoria</h3>
                  <div className="chart-container">
                    {Object.keys(getExpensesByCategory()).length > 0 ? (
                      <Doughnut 
                        data={expenseChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    ) : (
                      <p className="no-data">Nenhuma despesa encontrada</p>
                    )}
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Receitas por Categoria</h3>
                  <div className="chart-container">
                    {Object.keys(getIncomeByCategory()).length > 0 ? (
                      <Doughnut 
                        data={incomeChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    ) : (
                      <p className="no-data">Nenhuma receita encontrada</p>
                    )}
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Receitas vs Despesas</h3>
                  <div className="chart-container">
                    {(getTotalIncome() > 0 || getTotalExpenses() > 0) ? (
                      <Doughnut 
                        data={comparisonChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    ) : (
                      <p className="no-data">Nenhuma transação encontrada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Goals */}
          {activeSection === 'goals' && (
            <div className="goals-section">
              <div className="section-header">
                <h2>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</h2>
              </div>

              <form onSubmit={handleSubmitGoal} className="goal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome da Meta *</label>
                    <input
                      type="text"
                      value={goalForm.name}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Viagem, Carro novo..."
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Valor Total *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.targetAmount}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Atual</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.currentAmount}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, currentAmount: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Data Início</label>
                    <input
                      type="date"
                      value={goalForm.startDate}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Data Fim *</label>
                    <input
                      type="date"
                      value={goalForm.endDate}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingGoal ? 'Atualizar' : 'Adicionar'} Meta
                  </button>
                  {editingGoal && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingGoal(null);
                        setGoalForm({
                          name: '',
                          targetAmount: '',
                          currentAmount: '',
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: ''
                        });
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="goals-list">
                <h3>Minhas Metas</h3>
                <div className="goals-grid">
                  {goals.map(goal => (
                    <div key={goal.id} className="goal-card">
                      <div className="goal-header">
                        <h4>{goal.name}</h4>
                        <div className="goal-actions">
                          <button 
                            onClick={() => handleEditGoal(goal)}
                            className="btn-icon"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="btn-icon delete"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="goal-progress">
                        <div className="progress-info">
                          <span>{formatCurrency(goal.currentAmount)}</span>
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="progress-percentage">
                          {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% concluído
                        </div>
                      </div>
                      
                      <div className="goal-info">
                        <div className="goal-dates">
                          <span>De: {new Date(goal.startDate).toLocaleDateString('pt-BR')}</span>
                          <span>Até: {new Date(goal.endDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="monthly-savings">
                          <strong>Poupança mensal necessária: {formatCurrency(calculateMonthlySavingsNeeded(goal))}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {activeSection === 'categories' && (
            <div className="categories-section">
              <div className="section-header">
                <h2>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              </div>

              <form onSubmit={handleSubmitCategory} className="category-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome da Categoria *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Educação, Saúde..."
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select
                      value={categoryForm.type}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Cor</label>
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? 'Atualizar' : 'Adicionar'} Categoria
                  </button>
                  {editingCategory && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({
                          name: '',
                          type: 'expense',
                          color: '#ef4444'
                        });
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="categories-list">
                <h3>Categorias de Despesas</h3>
                <div className="categories-grid">
                  {categories.filter(cat => cat.type === 'expense').map(category => (
                    <div key={category.id} className="category-card">
                      <div className="category-color" style={{ backgroundColor: category.color }}></div>
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <div className="category-actions">
                          <button 
                            onClick={() => handleEditCategory(category)}
                            className="btn-icon"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="btn-icon delete"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3>Categorias de Receitas</h3>
                <div className="categories-grid">
                  {categories.filter(cat => cat.type === 'income').map(category => (
                    <div key={category.id} className="category-card">
                      <div className="category-color" style={{ backgroundColor: category.color }}></div>
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <div className="category-actions">
                          <button 
                            onClick={() => handleEditCategory(category)}
                            className="btn-icon"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="btn-icon delete"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {activeSection === 'reports' && (
            <div className="reports-section">
              <div className="section-header">
                <h2>Relatórios</h2>
              </div>

              <div className="filter-section">
                <h3>Filtrar por Período</h3>
                <div className="filter-form">
                  <div className="form-group">
                    <label>Data Inicial</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Data Final</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    onClick={exportToPDF}
                    className="btn btn-primary"
                    disabled={getFilteredTransactions().length === 0}
                  >
                    <Download size={20} />
                    Exportar PDF
                  </button>
                </div>
              </div>

              <div className="filtered-results">
                <h3>Transações do Período</h3>
                <div className="table-container">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTransactions().map(transaction => (
                        <tr key={transaction.id}>
                          <td>{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                          <td>{transaction.description}</td>
                          <td>{transaction.category}</td>
                          <td>
                            <span className={`type-badge ${transaction.type}`}>
                              {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className={`amount ${transaction.type}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {getFilteredTransactions().length === 0 && (
                  <p className="no-data">Nenhuma transação encontrada no período selecionado</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

export default App;