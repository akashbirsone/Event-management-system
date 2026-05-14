# **App Name**: EventPass

## Core Features:

- Secure Admin Login: Authenticate admins using ID and Password for secure access to the admin panel.
- Event Creation: Enable admins to create events by specifying event name, date, venue, and description.
- User Management: Allow admins to manually add users (Name, Roll No, Payment Status) or upload users in bulk via CSV/Excel.
- Unique QR Code Generation: Automatically generate a unique QR code for each user containing UserID, EventID, and a SecretKey.
- QR Pass Generation and Distribution Tool: Admins can view and download user QR codes as PNG/PDF for entry passes, and manually distribute them via WhatsApp/Email. The LLM will determine the best channel to notify the user.
- QR Code Scanning and Validation: Provide a scanner webapp to scan QR codes, validate their authenticity, check for duplicate entries, and mark users as 'Entered' upon successful validation.
- Live Entry Logs & Analytics: Display live entry logs with User Name, Roll No, Entry Time, and Exit Time, along with analytics on total users, total entries, and pending users.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) for a professional and trustworthy feel.
- Background color: Very light Indigo (#E8EAF6) to provide a calm and organized background.
- Accent color: Teal (#009688) to highlight important actions and elements, creating contrast.
- Body and headline font: 'PT Sans' for a clean and readable interface.
- Use simple, clear icons to represent actions and statuses, ensuring intuitive navigation.
- Employ a clean, organized layout with clear sections for each function (admin panel, user list, scanner interface, logs). Use of white space is critical.
- Subtle animations or transitions to provide feedback on actions, such as a scan confirmation or user entry.