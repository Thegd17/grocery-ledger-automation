const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleSpreadsheet } = require('google-spreadsheet');

// --------------------------------------------------------
// CONFIGURATION
// --------------------------------------------------------
// 👇 PASTE YOUR SPREADSHEET ID HERE
const SPREADSHEET_ID = '1rOjAH0Q7AV6dDuwSD43KbyFYxm14RipaaTHTmZbC7eI'; 
const CREDENTIALS_FILE = require('./credentials.json');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Shop Bot is Ready!'));

async function getSheet() {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(CREDENTIALS_FILE);
    await doc.loadInfo();
    return doc.sheetsByIndex[0]; 
}

// --------------------------------------------------------
// THE LOGIC
// --------------------------------------------------------
client.on('message', async (message) => {
    let text = message.body.trim(); 
    
    // Ignore groups
    const chat = await message.getChat();
    if (chat.isGroup) return;

    // ----------------------------------------------
    // 1. HELP COMMAND
    // ----------------------------------------------
    if (text.toLowerCase() === 'help') {
        await message.reply(
            "📋 *Commands:*\n" +
            "1. `Add Name` (New Customer)\n" +
            "2. `Name 50` (Add Bill)\n" +
            "3. `Name -20` (Payment)\n" +
            "4. `Name nil` (Clear Account)\n" +
            "5. `Show All` or `All Udhari` (List Dues)\n" +
            "6. `Total` (Market Summary)\n" +
            "7. `Del Name` (Delete Customer)"
        );
        return;
    }

    try {
        const sheet = await getSheet();
        const rows = await sheet.getRows();

        // ----------------------------------------------
        // 2. FEATURE: SHOW ALL DUES ("All Udhari")
        // ----------------------------------------------
        if (text.toLowerCase() === 'show all' || text.toLowerCase() === 'all udhari') {
            let report = "📜 *All Pending Dues:*\n------------------\n";
            let found = false;

            rows.forEach(row => {
                const bal = parseInt(row.Balance);
                // Only show people who owe money (Balance > 0)
                if (!isNaN(bal) && bal > 0) {
                    report += `👤 ${row.Name}: ₹${bal}\n`;
                    found = true;
                }
            });

            if (!found) {
                await message.reply("✅ Amazing! No pending dues in the market.");
            } else {
                await message.reply(report);
            }
            return;
        }

        // ----------------------------------------------
        // 3. FEATURE: TOTAL MARKET OUTSTANDING
        // ----------------------------------------------
        if (text.toLowerCase() === 'total') {
            let totalDue = 0;
            let customerCount = 0;

            rows.forEach(row => {
                const bal = parseInt(row.Balance);
                if (!isNaN(bal) && bal > 0) {
                    totalDue += bal;
                    customerCount++;
                }
            });

            await message.reply(`💰 *Market Report*\n\n📉 Total Outstanding: *₹${totalDue}*\n👥 From: ${customerCount} customers`);
            return;
        }

        // ----------------------------------------------
        // 4. FEATURE: REMOVE / DELETE CUSTOMER
        // ----------------------------------------------
        if (text.toLowerCase().startsWith('remove ') || text.toLowerCase().startsWith('del ')) {
            let nameToDelete = text.toLowerCase().startsWith('remove ') ? text.substring(7).trim() : text.substring(4).trim();

            const rowToDelete = rows.find(row => row.Name.toLowerCase() === nameToDelete.toLowerCase());

            if (!rowToDelete) {
                await message.reply(`❌ Cannot delete. Customer "${nameToDelete}" not found.`);
            } else {
                if (parseInt(rowToDelete.Balance) > 0) {
                    await message.reply(`⚠️ Warning: ${rowToDelete.Name} still owes ₹${rowToDelete.Balance}.\nPlease clear the due before deleting.`);
                } else {
                    await rowToDelete.delete(); 
                    await message.reply(`🗑️ Customer *${nameToDelete}* has been removed.`);
                }
            }
            return;
        }

        // ----------------------------------------------
        // 5. FEATURE: ADD NEW CUSTOMER
        // ----------------------------------------------
        if (text.toLowerCase().startsWith('add ')) {
            const newName = text.substring(4).trim(); 
            const existing = rows.find(row => row.Name.toLowerCase() === newName.toLowerCase());
            if (existing) {
                await message.reply(`⚠️ "${newName}" already exists!`);
            } else {
                await sheet.addRow({ Name: newName, Balance: 0, Last_Transaction: 'Account Created' });
                await message.reply(`✅ Added new customer: *${newName}*`);
            }
            return;
        }

        // ----------------------------------------------
        // 6. TRANSACTION PARSING (Name vs Amount)
        // ----------------------------------------------
        const parts = text.split(' ');
        const lastWord = parts[parts.length - 1].toLowerCase();
        
        let nameInput = "";
        let amountInput = null;
        const clearKeywords = ['clear', 'nil', 'paid', 'zero', '0'];

        const isNumber = !isNaN(parseInt(lastWord));
        const isClearCommand = clearKeywords.includes(lastWord);

        if (isNumber || isClearCommand) {
            amountInput = lastWord;
            nameInput = parts.slice(0, -1).join(' '); 
        } else {
            nameInput = text;
        }

        const customerRow = rows.find(row => row.Name.toLowerCase() === nameInput.toLowerCase());

        if (!customerRow) {
            if (amountInput) {
                 await message.reply(`❌ Customer "${nameInput}" not found.`);
            } else {
                await message.reply(`❌ Customer "${nameInput}" not found.`);
            }
            return;
        }

        const currentBalance = parseInt(customerRow.Balance);

        // CHECK BALANCE ONLY
        if (amountInput === null) {
            await message.reply(`📋 *${customerRow.Name}*\nCurrent Due: ₹${currentBalance}`);
            return;
        }

        // FULL CLEAR
        if (isClearCommand) {
            if (currentBalance === 0) {
                await message.reply(`✅ ${customerRow.Name} is already clear.`);
                return;
            }
            customerRow.Balance = 0;
            customerRow.Last_Transaction = new Date().toLocaleString() + " (Cleared)";
            await customerRow.save();
            await message.reply(`🎉 *Cleared!* \nCollected: ₹${currentBalance}\n✅ ${customerRow.Name} balance is now 0.`);
            return;
        }

        // ADD / SUBTRACT
        const amount = parseInt(amountInput);

        // Overpayment Protection
        if (amount < 0) {
            const paymentAmount = Math.abs(amount);
            if (paymentAmount > currentBalance) {
                await message.reply(`⚠️ *Overpayment Warning*\n${customerRow.Name} only owes ₹${currentBalance}. You typed ₹${paymentAmount}.`);
                return;
            }
        }

        const newBalance = currentBalance + amount;
        customerRow.Balance = newBalance;
        customerRow.Last_Transaction = new Date().toLocaleString();
        await customerRow.save();

        if (amount > 0) {
            await message.reply(`✅ Added ₹${amount} to ${customerRow.Name}.\n💰 Total Due: ₹${newBalance}`);
        } else {
            await message.reply(`💵 Payment: ₹${Math.abs(amount)}\n📉 ${customerRow.Name} Remaining: ₹${newBalance}`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
});

client.initialize();