# Database Conversion (Assignment 4 Part 2)

## LLM system used
Claude Opus 5.5 (Anthropic), model id `claude-opus-5-5`, used through the Claude Code extension
for Visual Studio Code. Claude Code had access to the project folder and a terminal, so it wrote
`db_transform.js`, made the application changes and ran the tests itself.

## Prompts submitted
Responses are not included, as instructed.

### Prompt 1
The Assignment 4 PDF (`INFS3201_Assignment_4.pdf`) was attached to this prompt:

> with the rules you know about our website, the rules in this pdf solve the assignment as per the
> requirements and make sure to include the mongodb connection string as a comment. Do not push,
> give me the terminal prompts to push to the repo

No follow-up prompts were needed for Part 2.

## What was changed
- `db_transform.js` (run once with `node db_transform.js` on 2026-11-11):
  - backs up `customers`, `services` and `orders` to `backup-<timestamp>/` first
  - sets `orders.customerId` to the customer's `_id` and `orders.items[].serviceId` to the service's `_id`
  - removes `customers.customerId`, `services.serviceId` and `orders.orderId`
  - drops the old unique indexes on those three fields
  - stops without changing anything if the database has already been converted
- `persistence.js` finds and updates documents by `_id`. Ids arriving from the browser are converted
  to `ObjectId` there, and anything that is not a valid 24 character id simply finds nothing.
- `business.js` and the views show the order `_id` as the order number and match customers by `_id`.
