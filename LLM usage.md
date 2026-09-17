# LLM Usage

**Course:** INFS3201 - Assignment 1
**Student:** Amro Ansari (SID: 60311994), Section 8
**LLM used:** Claude (Anthropic)

I used Claude, a large language model, to help with parts of this assignment. The program logic is my own work. This document lists what Claude helped with and the exact prompts I used.

## How I used Claude

### 1. Documentation comments
Claude wrote the JSDoc comments in `main.js`, including the file header and the comment above each function.

### 2. Checking my code
I asked Claude to review my code for mistakes. It pointed out problems and explained how to fix them. **Claude did not write these fixes.** I made the changes myself, following its explanations, and then Claude checked them.

### 3. Table formatting (`padEnd`)
Claude wrote the `padEnd` formatting that lines up the columns in the tables (the services list and the customer orders list).

### 4. Indentation and output
I used Claude to check that my code was indented consistently and that the program's output was correct for each menu option. In the final check, Claude made these changes to `main.js` directly:
- In `generateOrder`, it fixed the indentation of the services table, split two statements that were on one line, and moved `let answer = "start";` down to just above the loop that uses it.
- It moved `const prompt = promptSync();` below the `import` lines.

These changes only affect layout; they do not change what the program does.

### 5. Project setup and data files
Claude undid an `npm install node` that I ran by mistake. It deleted the `node_modules` folder, and restored `orders.json` to its original content after my testing had added orders to it.

## Prompts used

### Prompt 1 - Code review, documentation and table formatting
```
This is the code I wrote for a university assignment (document attached and the code is in the main.js file in the linked folder) please go through the assignment and the code and check for the following:
1 - Proper indentation as per the assignment requirement
2 - The main logic is correct and if not please let me know the mistakes (syntax or logical) and instruct me on how to fix them (Do not directly give me the answer - make sure I understand and then I do it my self and then you check it)

I also need help with the following:
1 -  Proper documentation as per the assignment requirements
2 - Table formatting of the loadServices, loadCustomers and loadOrders function

Just to note: We are allowed to use LLMs in our projects but we have to note the prompt we used and mention that we used it in a document that we will name LLM usage so please keep track of what you helped me with and make sure to include it in the document
```

### Prompt 2 - Undoing the npm install
```
I have just run npm install node and it seems to have caused a problem can you reverse that
```

### Prompt 3 - Cleanup, final check and this document
```
Okay I need you to:
1) Delete the node_modules
2) Make sure the indentation and logic is correct and clean
3) Make an md document called LLM usage written in raw where I acknowledge my use of LLM (Claude) for writing the documentation comments, checking my code and instructing me on how to fix some stuff.
```

### Prompt 4 - Restoring the data files
```
Also make sure the orders, services and customers folders are back to their original content
```

### Prompt 5 - Adding the prompts to this document
```
The prompts I used for these tasks should be mentioned in usage LLM
```
