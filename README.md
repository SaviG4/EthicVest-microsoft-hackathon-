# EthicalVest AI — Responsible Investment Decision Support

**EthicalVest AI** is an institutional-grade decision-support platform designed for charity trustees, investment committees, and responsible-investment analysts. It evaluates potential fund investments against documented ethical exclusions while balancing financial risk, ongoing charges (OCF), diversification, and data quality.

> **Core System Principle:**  
> *Rules determine compliance. Python calculates numbers. Evidence supports claims. The LLM explains results. Humans retain decision-making authority.*

---

## 1. Research Case Study & Hypothetical Profile

The system uses the **Joseph Rowntree Charitable Trust (JRCT)** as an authoritative research case study:
- **Official Policy Reference:** [https://www.jrct.org.uk/finance-and-investment](https://www.jrct.org.uk/finance-and-investment)
- **Hypothetical Client Profile:** *Ethical Investment Charity — Demonstration Profile*
- **Endowment Capital:** £100,000 GBP
- **Mandatory Exclusions:** Fossil fuel exploration & refining (0%), Thermal coal mining (0%), Armaments & weapons systems (0%), Tobacco manufacturing (0%), Predatory gambling operations (0%).
- **Governance Safeguard:** A missing disclosure is never treated as zero exposure. Mandatory exclusions can never be offset by positive ESG scores or past performance.

---

## 2. Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons | Responsive multi-screen UI with dark financial aesthetic |
| **Web Server** | Node.js, Express, tsx, Vite SPA middleware | Full-stack server running on port 3000 |
| **Deterministic Screening Engine** | Python 3.10+, SQLite3 | Exact rule evaluation and exclusion classification |
| **Portfolio Calculations** | Python `decimal.Decimal` | Penny-exact arithmetic (`allocated + cash == £100,000.00`) |
| **Generative AI** | Google Gemini 3.8 Flash (`@google/genai`) | Structured JSON explanations citing registered source IDs |
| **Automated Testing** | Python `unittest` (pytest-compatible) | 10 automated test cases for rules, decimal safety, and exclusions |
| **Database** | SQLite (`backend/ethicalvest.db`) | 15 relational tables with transactions & audit trail |

---

## 3. Directory Structure

```
├── backend/
│   ├── database.py             # SQLite schema and connection helpers
│   ├── seed_data.py            # High-fidelity JRCT policy & 9 candidate funds
│   ├── screening_engine.py     # Deterministic Python ethical screening engine
│   ├── portfolio_calculator.py # Decimal-safe constrained allocation engine
│   ├── test_ethicalvest.py     # Automated unit test suite (10 test cases)
│   ├── run_tests_json.py       # JSON test runner for interactive UI
│   ├── db_query.py             # Node.js SQLite bridge
│   ├── cli.py                  # CLI bridge for server subprocess calls
│   └── ethicalvest.db          # Persistent SQLite database
├── src/
│   ├── components/             # Header, Sidebar, CandidateModal, TestRunnerModal
│   ├── views/                  # Dashboard, Profile, Screening, Portfolio, Analyst, etc.
│   ├── types.ts                # TypeScript domain models
│   ├── api.ts                  # Typed API client
│   ├── App.tsx                 # Root React application
│   └── main.tsx                # Client entry point
├── server.ts                   # Express server with REST API & Vite middlewares
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable configuration
├── metadata.json               # AI Studio application metadata
└── package.json                # Node.js dependencies and scripts
```

---

## 4. Quick Start & Execution

### Running the Full-Stack Application
```bash
npm run dev
# Starts Express server on port 3000 mounting Vite SPA
```

### Running the Python Engine Tests Directly
```bash
python3 backend/test_ethicalvest.py
```
Output:
```
Ran 10 tests in 0.036s
OK
```

### Re-seeding Demo Data
```bash
python3 backend/seed_data.py
```

---

## 5. Primary 4-Screen Workflow

1. **Charity Profile (Screen 1):** Define endowment requirements, risk tolerance, cash reserve (5%), and customize ethical policy rules.
2. **Ethical Screening (Screen 2):** Run the deterministic Python screening engine across 9 candidate funds. View verdicts:
   - `ELIGIBLE FOR FURTHER COMPARISON` (e.g. Stewart Investors, Impax Environmental, Liontrust, Rathbone)
   - `EXCLUDED` (e.g. Vanguard FTSE All-World due to Shell/Lockheed/BAT, iShares FTSE 100, Coal Test Fund)
   - `NEEDS INVESTIGATION` (e.g. Baillie Gifford due to 74% opaque holdings, Synthetic Beta)
3. **Portfolio Builder (Screen 3):** Allocate the £100,000 budget with exact penny reconciliation (£95,000.00 invested + £5,000.00 cash reserve).
4. **AI Investment Analyst (Screen 4):** Click **"Explain My Recommendation"** for a structured JSON explanation backed by citations, followed by interactive decision-support chat.

---

## 6. Regulatory & Prototype Disclaimer

*EthicalVest AI is a decision-support prototype built for demonstration and research purposes. It is not an authorized financial adviser, does not execute financial transactions, and does not provide regulated investment advice.*
