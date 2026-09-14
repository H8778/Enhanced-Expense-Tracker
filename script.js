const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "always",
});

const list = document.getElementById("transactionList");
const form = document.getElementById("transactionForm");
const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const dateInput = document.getElementById("date");

dateInput.defaultValue = new Date().toISOString().split("T")[0];

form.addEventListener("submit", addTransaction);

function formatCurrency(value) {
  if (value === 0) {
    return formatter.format(0).replace(/^[+-]/, "");
  }
  return formatter.format(value);
}

function createItem({ id, name, amount, date, type }) {
  const sign = "income" === type ? 1 : -1;

  const li = document.createElement("li");

  li.innerHTML = `
      <div class="name">
        <h4>${name}</h4>
        <p>${new Date(date).toLocaleDateString()}</p>
      </div>

      <div class="amount ${type}">
        <span>${formatCurrency(amount * sign)}</span>
      </div>
    `;

  li.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm("Delete transaction?")) {
      deleteTransaction(id);
    }
  });

  return li;
}

function updateTotal() {
  const incomeTotal = transactions
    .filter((trx) => trx.type === "income")
    .reduce((total, trx) => total + trx.amount, 0);

  const expenseTotal = transactions
    .filter((trx) => trx.type === "expense")
    .reduce((total, trx) => total + trx.amount, 0);

  const balanceTotal = incomeTotal - expenseTotal;

  balance.textContent = formatCurrency(balanceTotal).replace(/^\+/, "");
  income.textContent = formatCurrency(incomeTotal);
  expense.textContent = formatCurrency(expenseTotal * -1);
}

function renderList() {
  list.innerHTML = "";

  transactions.forEach((transaction) => {
    const li = createItem(transaction);
    list.appendChild(li);
  });
}

renderList();
updateTotal();

function deleteTransaction(id) {
  const index = transactions.findIndex((trx) => trx.id === id);
  transactions.splice(index, 1);

  list.removeChild(list.children[index]);

  updateTotal();
  saveTransactions();
}

function addTransaction(e) {
  e.preventDefault();

  const formData = new FormData(form);
  form.reset();

  const uniqueId =
    Date.now().toString(36) + Math.random().toString(36).substring(2);

  const newTransaction = {
    id: uniqueId,
    name: formData.get("name"),
    amount: parseFloat(formData.get("amount")),
    date: new Date(formData.get("date")),
    type: "on" === formData.get("type") ? "expense" : "income",
  };

  if (
    !newTransaction.name ||
    isNaN(newTransaction.amount) ||
    !newTransaction.date
  ) {
    alert("Please fill in all fields correctly.");
    return;
  }

  transactions.push(newTransaction);
  saveTransactions();

  const index = transactions.findIndex((trx) => trx.id === uniqueId);
  const newListItem = createItem(newTransaction);
  if (index === 0) {
    list.prepend(newListItem);
  } else {
    const previousListItem = list.children[index - 1];
    previousListItem.insertAdjacentElement("afterend", newListItem);
  }

  updateTotal();
}

function saveTransactions() {
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  localStorage.setItem("transactions", JSON.stringify(transactions));
}
// =====================
// DARK MODE
// =====================
const darkModeBtn = document.getElementById("darkModeBtn");

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
}

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("darkMode", "enabled");
    } else {
      localStorage.setItem("darkMode", "disabled");
    }
  });
}

// =====================
// SEARCH TRANSACTION
// =====================
const searchInput = document.getElementById("search");

if (searchInput) {
  searchInput.addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const items = document.querySelectorAll("#transactionList li");

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();

      if (text.includes(filter)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  });
}

// =====================
// EXPORT BUTTON
// =====================
const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const data = localStorage.getItem("transactions");

    if (!data || data === "[]") {
      alert("No transactions available.");
      return;
    }

    const blob = new Blob([data], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.json";
    link.click();
  });
}

// =====================
// MONTHLY BUDGET CHECK
// =====================
const budgetInput = document.getElementById("budget");

if (budgetInput) {
  budgetInput.addEventListener("change", () => {
    localStorage.setItem("monthlyBudget", budgetInput.value);
  });

  budgetInput.value =
    localStorage.getItem("monthlyBudget") || "";
}
document.getElementById("pdfBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Expense Tracker Report", 20, 20);

  let y = 40;

  transactions.forEach((t) => {
    doc.text(
      `${t.name} | ${t.amount} | ${t.type} | ${new Date(t.date).toLocaleDateString()}`,
      20,
      y
    );
    y += 10;
  });

  doc.save("Expense_Report.pdf");
});