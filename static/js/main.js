const defaults = [
  ["Rent", 8000],
  ["Food", 2500],
  ["Transport", 2000],
  ["Dining", 1500],
  ["Entertainment", 2500],
  ["Utilities", 2000],
  ["Shopping", 1000],
];

const financeForm = document.getElementById("finance-form");
const expenseList = document.getElementById("expenses");
const addExpenseButton = document.getElementById("add-expense");
const resetButton = document.getElementById("reset-button");
const submitButton = document.getElementById("submit-button");
const buttonLabel = submitButton.querySelector(".button-label");
const buttonLoader = submitButton.querySelector(".button-loader");
const errorMessage = document.getElementById("error");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function addExpense(category = "", amount = "") {
  const row = document.createElement("div");
  row.className = "expense-row";
  row.innerHTML = `
    <input class="ec" aria-label="Expense category" placeholder="Category" value="${escapeHtml(category)}">
    <input class="ea" aria-label="Expense amount" type="number" min="0" step="0.01" placeholder="Amount" value="${escapeHtml(amount)}">
    <button class="remove" type="button" aria-label="Remove expense"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
  `;
  row.querySelector(".remove").addEventListener("click", () => row.remove());
  expenseList.appendChild(row);
}

function collectPayload() {
  const expenses = {};
  document.querySelectorAll(".expense-row").forEach((row) => {
    const category = row.querySelector(".ec").value.trim();
    const amount = Number.parseFloat(row.querySelector(".ea").value);
    if (category && Number.isFinite(amount)) {
      expenses[category] = amount;
    }
  });

  return {
    name: document.getElementById("name").value,
    income: Number.parseFloat(document.getElementById("income").value),
    expenses,
    goal: document.getElementById("goal").value,
  };
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  buttonLabel.classList.toggle("hidden", isLoading);
  buttonLoader.classList.toggle("hidden", !isLoading);
  submitButton.setAttribute("aria-busy", String(isLoading));
}

function renderResults(data) {
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("rIncome").textContent = money(data.totals.income);
  document.getElementById("rExpense").textContent = money(data.totals.expense);
  document.getElementById("rBalance").textContent = money(data.totals.balance);
  document.getElementById("rRate").textContent = data.totals.rate + "%";
  document.getElementById("summary").textContent = data.summary;
  document.getElementById("source").textContent = data.source === "gemini-3.8-flash" ? "Gemini AI" : "Demo fallback";

  document.getElementById("budget").innerHTML = data.budget.map((item) => {
    const percentage = Math.min(Math.max(Number(item.percentage) || 0, 0), 100);
    return `
      <article class="budget-card">
        <div class="budget-meta">
          <span class="budget-category"><i class="fa-solid fa-wallet" aria-hidden="true"></i>${escapeHtml(item.category)}</span>
          <span class="budget-amount">${money(item.recommended_amount)}</span>
        </div>
        <div class="progress-track" role="progressbar" aria-label="${escapeHtml(item.category)} recommended allocation" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar" style="width:${percentage}%"></div>
        </div>
        <div class="budget-foot"><span>${escapeHtml(item.reason)}</span><strong>${item.percentage}%</strong></div>
      </article>
    `;
  }).join("");

  document.getElementById("analysis").innerHTML = data.analysis.map((item) => {
    const status = String(item.status).toLowerCase().includes("over") ? "overspending" : "on-track";
    return `
      <article class="analysis-chip ${status}">
        <span class="status-dot" aria-hidden="true"></span>
        <div><span class="analysis-name">${escapeHtml(item.category)}</span><span class="analysis-message">${escapeHtml(item.message)}</span></div>
        <strong class="analysis-percent">${item.percentage_of_income}%</strong>
      </article>
    `;
  }).join("");

  document.getElementById("suggestions").innerHTML = data.suggestions.map((item) => `
    <li class="suggestion-item">
      <div>
        <div class="suggestion-title">${escapeHtml(item.title)}</div>
        <p class="suggestion-detail">Target: ${escapeHtml(item.target)} | Amount: ${money(item.amount)}</p>
        <p class="suggestion-action">${escapeHtml(item.action)}</p>
      </div>
    </li>
  `).join("");

  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleSubmit(event) {
  event.preventDefault();
  errorMessage.classList.add("hidden");
  setLoading(true);

  try {
    const response = await fetch("/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectPayload()),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Analysis failed.");
    }
    renderResults(data);
  } catch (error) {
    errorMessage.textContent = error.message || "Unable to complete the analysis.";
    errorMessage.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
}

defaults.forEach(([category, amount]) => addExpense(category, amount));
financeForm.addEventListener("submit", handleSubmit);
addExpenseButton.addEventListener("click", () => addExpense());
resetButton.addEventListener("click", () => window.location.reload());
