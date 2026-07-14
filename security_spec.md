# Security Specification: Cash Flow & Debts

This document outlines the security requirements and invariants for the Firestore database of our Cash Flow & Debts applet.

## 1. Data Invariants

1. **Owner Integrity (Identity Isolation)**: A user can only read, create, update, or delete their own transactions or debts. The `userId` property on every document must strictly match the authenticated user's `request.auth.uid`.
2. **Structure & Type Safety**:
   - Every transaction must have valid types for its properties: `id` (string), `userId` (string), `type` (string, either `income` or `expense`), `amount` (number > 0), `description` (string), `category` (string), and `date` (string).
   - Every debt must have valid types for its properties: `id` (string), `userId` (string), `debtorName` (string), `amount` (number > 0), `description` (string), `date` (string), `status` (string, either `pending` or `paid`).
3. **Immutability**:
   - `userId` on any existing document is immutable and cannot be changed or transferred to another user.
   - `id` on any document is immutable.

## 2. The "Dirty Dozen" Threat Payloads (Denied States)

These payloads must be strictly blocked by our Firestore rules:

1. **Spoofed User Transaction Creation**: A user with UID `user_A` attempts to write a transaction with `userId: "user_B"`.
2. **Junk ID Poisoning on Transaction**: A user attempts to create a transaction with an excessively large document ID (e.g., > 128 characters) or junk characters.
3. **Invalid Transaction Type**: A transaction created with `type: "borrowed"`.
4. **Negative Transaction Amount**: A transaction created with `amount: -150`.
5. **No-auth Transaction Creation**: An unauthenticated client attempts to create a transaction.
6. **Cross-User Transaction Modification**: A user with UID `user_A` attempts to edit a transaction belonging to `user_B`.
7. **Identity Hijacking on Transaction Update**: A user attempts to change the `userId` of an existing transaction from `user_A` to `user_C`.
8. **Spoofed User Debt Creation**: A user with UID `user_A` attempts to write a debt with `userId: "user_B"`.
9. **Negative Debt Amount**: A debt created with `amount: -50.00`.
10. **Invalid Debt Status**: A debt created with `status: "unknown"`.
11. **Cross-User Debt Modification**: A user with UID `user_A` attempts to edit or delete a debt belonging to `user_B`.
12. **Blanket Query Attempt**: A user attempts to run a query to fetch all transactions without filtering by their own `userId`.

## 3. Test Verification Plan

Our tests verify that:
- Authentic users can securely query their own records.
- Cross-user modifications, unauthenticated access, and malformed structures are completely blocked with `PERMISSION_DENIED`.
