

export type AppEvent = {
  id: string;
  name: string;
  description: string;
  secretKey: string;
  registrationStatus: 'Open' | 'Closed';
  adminId: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  contactInfo?: string;
  registrationStartDate?: string;
  registrationStartTime?: string;
  registrationEndDate?: string;
  registrationEndTime?: string;
  departments?: string[];
  eventType?: 'Free' | 'Paid';
  eventFee?: number;
  upiId?: string;
  payeeName?: string;
};

export type User = {
  id: string;
  name:string;
  uniqueId: string; // Pass ID
  standard: string;
  department: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending' | 'Refunded' | 'Refund In Progress';
  eventId: string;
  email?: string;
  emailOrPhone?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  entered: boolean;
  entryTime?: string;
  exitTime?: string;
  transactionId?: string;
  screenshotPath?: string;
};

export type EntryLog = {
  id: string;
  userName: string;
  uniqueId: string; // Pass ID
  entryTime: string;
  exitTime?: string;
  eventId: string;
};

export type QrData = {
  userId: string;
  eventId?: string;
  secretKey?: string;
};

export type Admin = {
  id: string;
  name: string;
  password?: string; // Should be hashed in a real app
  role: 'Admin' | 'EventsManager';
  phoneNumber?: string;
  hasCompletedSetup?: boolean;
  securityPin?: string;
  securityQuestion?: string;
  securityAnswer?: string;
};

export type RefundRequest = {
  id: string;
  eventId: string;
  eventName: string;
  passId: string;
  userId: string;
  userName: string;
  fullName: string;
  emailOrPhone: string;
  paymentMethod: 'GPay' | 'PhonePe' | 'Paytm';
  transactionId: string;
  upiIdOrAccount: string;
  paymentDate: string;
  amountPaid: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid' | 'Under Review';
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  refundCharge?: number;
  finalRefundAmount?: number;
  agreedToTerms?: boolean;
  screenshotPath?: string;
  eventAdminId?: string;
};

export type AuditLog = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  entityType: 'EVENT' | 'USER' | 'ADMIN' | 'REFUND';
  entityId: string;
  adminId: string;
  timestamp: string;
  details: string;
};
