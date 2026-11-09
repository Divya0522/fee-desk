/**
 * FeeDesk Mock Data Seed
 * Clearly fake demonstration data for coaching institute parent & staff auth.
 */

export const SEED_STUDENTS = [
  {
    phone: import.meta.env?.VITE_TEST_PARENT_PHONE || '9000000001',
    studentId: 'STU-0587',
    studentName: 'Ishita Sharma',
    batch: 'JEE 2027 Evening',
    centre: 'Vaishali Nagar',
    guardianName: 'Rajesh Sharma',
    relationship: 'Father',
    isActivated: true,
    amountDue: 15000,
    dueDate: '10 Oct 2026',
    overdueDays: 23,
    instalments: [
      { name: 'Instalment 1', amount: 30000, status: 'paid', date: 'Paid ₹30,000' },
      { name: 'Instalment 2', amount: 30000, status: 'paid', date: 'Paid ₹30,000' },
      { name: 'Instalment 3', amount: 15000, status: 'due', date: 'Due 10 Oct 2026' },
    ],
  },
  {
    phone: '9000000002',
    studentId: 'STU-0412',
    studentName: 'Aarav Meena',
    batch: 'JEE 2027 Morning',
    centre: 'Malviya Nagar',
    guardianName: 'Suresh Meena',
    relationship: 'Father',
    isActivated: true,
    amountDue: 22000,
    dueDate: '15 Nov 2026',
    overdueDays: 0,
    instalments: [
      { name: 'Instalment 1', amount: 25000, status: 'paid', date: 'Paid ₹25,000' },
      { name: 'Instalment 2', amount: 22000, status: 'due', date: 'Due 15 Nov 2026' },
    ],
  },
  {
    phone: import.meta.env?.VITE_TEST_UNACTIVATED_PHONE || '9000000003',
    studentId: 'STU-0219',
    studentName: 'Mohit Gurjar',
    batch: 'NEET 2027 Morning',
    centre: 'Malviya Nagar',
    guardianName: '',
    relationship: '',
    isActivated: false, // NOT yet activated! Use for sign up activation demo
    amountDue: 22000,
    dueDate: '20 Nov 2026',
    overdueDays: 0,
    instalments: [
      { name: 'Instalment 1', amount: 22000, status: 'due', date: 'Due 20 Nov 2026' },
    ],
  },
]

export const SEED_STAFF = [
  {
    email: import.meta.env?.VITE_TEST_ADMIN_EMAIL || 'admin@feedesk.demo',
    password: import.meta.env?.VITE_TEST_STAFF_PASSWORD || 'Demo@1234',
    name: 'Vikramaditya Rathore',
    role: 'centre_admin',
    centre: 'Jaipur Main Centre',
  },
  {
    email: import.meta.env?.VITE_TEST_ACCOUNTS_EMAIL || 'accounts@feedesk.demo',
    password: import.meta.env?.VITE_TEST_STAFF_PASSWORD || 'Demo@1234',
    name: 'Anjali Verma',
    role: 'accounts',
    centre: 'Jaipur Main',
  },
]

export const DEMO_OTP = import.meta.env?.VITE_DEMO_OTP || '123456'
