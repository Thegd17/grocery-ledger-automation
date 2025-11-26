# 🛒 Grocery Ledger Automation (WhatsApp Bot)

> **A Server-Side WhatsApp Bot that digitizes the manual ledger (Khata) system for a local grocery shop.**

![Project Demo](https://via.placeholder.com/800x400?text=Upload+Your+WhatsApp+Screenshot+Here)
*(Replace the link above with your actual screenshot url)*

## 📖 The Story
My father runs a grocery shop and has always relied on physical notebooks to track customer debts ("Udhari"). This manual process led to calculation errors, lost data, and hours spent totaling amounts at the end of the month.

I built this bot to solve that problem. Now, he simply messages the bot on WhatsApp, and it handles all the accounting automatically in the cloud.

## 🚀 Key Features
- **Natural Language Processing:** Distinguishes between adding a customer (`Add Rahul`) and adding a bill (`Rahul 50`) using custom parsing logic.
- **Real-time Database:** Uses Google Sheets as a backend, allowing for manual checks and data export.
- **Overpayment Protection:** Logic to prevent accepting payments larger than the current due amount.
- **Market Snapshot:** A single command (`Total`) calculates the total outstanding money in the market.
- **Zero Cost:** Runs on open-source libraries and free-tier APIs.

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Automation:** `whatsapp-web.js` (Puppeteer)
* **Database:** Google Sheets API (`google-spreadsheet`)
* **Authentication:** Google Service Account (JWT)

## 📸 How It Works

| Action | Command | Bot Response |
| :--- | :--- | :--- |
| **New Customer** | `Add Amit` | ✅ Added new customer: Amit |
| **Add Bill** | `Amit 50` | ✅ Added ₹50 to Amit. Total Due: ₹50 |
| **Payment** | `Amit -20` | 💵 Payment Received: ₹20. Remaining: ₹30 |
| **Clear Dues** | `Amit clear` | 🎉 Full Payment Received! Amit is now 0. |
| **Check Market** | `Total` | 📉 Total Outstanding: ₹15,400 |

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/grocery-ledger-automation.git](https://github.com/YOUR_USERNAME/grocery-ledger-automation.git)
   cd grocery-ledger-automation

2. **Install dependencies**
```Bash

npm install


3. **Setup Credentials**

   1.Create a Project in Google Cloud Console.

   2.Search for and Enable Google Sheets API.

   3.Create a Service Account and download the JSON key.

   4.Rename the file to credentials.json and place it in the root folder of this project.

   5.Important: Open the JSON file, copy the client_email, and share your Google Sheet with that email address (give it Editor access).

4. **Run the Bot**
```Bash

node index.js
A QR code will appear in the terminal. Scan it with your WhatsApp (Linked Devices), and the bot is ready!

🚧 **Future Roadmap**

[ ] Add PDF Invoice generation.

[ ] Add Daily Summary auto-messages.

Made with ❤️ for my Dad's Shop.
