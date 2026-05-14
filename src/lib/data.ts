'use server';

import { createClient } from '@supabase/supabase-js';
import type { AppEvent, User, EntryLog, Admin, RefundRequest, AuditLog } from '@/lib/definitions';

// Initialize Supabase Client
// Note: We use the anon key here. Since we disabled RLS in the new schema, this will work for all queries.
// In a production environment with RLS, you should pass cookies or use a Service Role Key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getEvents(): Promise<AppEvent[]> {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  // Map snake_case to camelCase
  return data.map((e: any) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    secretKey: e.secret_key,
    registrationStatus: e.registration_status,
    adminId: e.admin_id,
    startDate: e.start_date,
    endDate: e.end_date,
    startTime: e.start_time,
    endTime: e.end_time,
    venue: e.venue,
    address: e.address,
    contactInfo: e.contact_info,
    registrationStartDate: e.registration_start_date,
    registrationStartTime: e.registration_start_time,
    registrationEndDate: e.registration_end_date,
    registrationEndTime: e.registration_end_time,
    departments: e.departments,
    eventType: e.event_type,
    eventFee: e.event_fee,
    upiId: e.upi_id,
    payeeName: e.payee_name
  }));
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data.map((u: any) => ({
    id: u.id,
    name: u.name,
    uniqueId: u.unique_id,
    standard: u.standard,
    department: u.department,
    status: u.status,
    paymentStatus: u.payment_status,
    eventId: u.event_id,
    email: u.email,
    emailOrPhone: u.email_or_phone,
    phoneNumber: u.phone_number,
    whatsappNumber: u.whatsapp_number,
    entered: u.entered,
    entryTime: u.entry_time,
    exitTime: u.exit_time,
    transactionId: u.transaction_id,
    screenshotPath: u.screenshot_path,
  }));
}

export async function getLogs(): Promise<EntryLog[]> {
  const { data, error } = await supabase.from('entry_logs').select('*');
  if (error) return [];
  return data.map((l: any) => ({
    id: l.id,
    userName: l.user_name,
    uniqueId: l.unique_id,
    entryTime: l.entry_time,
    exitTime: l.exit_time,
    eventId: l.event_id,
  }));
}

export async function getAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase.from('admins').select('*');
  if (error) return [];
  return data.map((a: any) => ({
    id: a.id,
    name: a.name,
    password: a.password,
    role: a.role,
    phoneNumber: a.phone_number,
    hasCompletedSetup: a.has_completed_setup,
    securityPin: a.security_pin,
    securityQuestion: a.security_question,
    securityAnswer: a.security_answer,
  }));
}

export async function getRefunds(): Promise<RefundRequest[]> {
  const { data, error } = await supabase.from('refund_requests').select('*');
  if (error) return [];
  return data.map((r: any) => ({
    id: r.id,
    eventId: r.event_id,
    eventName: r.event_name,
    passId: r.pass_id,
    userId: r.user_id,
    userName: r.user_name,
    fullName: r.full_name,
    emailOrPhone: r.email_or_phone,
    paymentMethod: r.payment_method,
    transactionId: r.transaction_id,
    upiIdOrAccount: r.upi_id_or_account,
    paymentDate: r.payment_date,
    amountPaid: r.amount_paid,
    reason: r.reason,
    status: r.status,
    requestedAt: r.requested_at,
    approvedAt: r.approved_at,
    paidAt: r.paid_at,
    rejectionReason: r.rejection_reason,
    refundCharge: r.refund_charge,
    finalRefundAmount: r.final_refund_amount,
    agreedToTerms: r.agreed_to_terms,
    screenshotPath: r.screenshot_path,
    eventAdminId: r.event_admin_id,
  }));
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) return [];
  return data.map((a: any) => ({
    id: a.id,
    action: a.action,
    entityType: a.entity_type,
    entityId: a.entity_id,
    adminId: a.admin_id,
    timestamp: a.timestamp,
    details: a.details,
  }));
}

export async function addEvent(event: AppEvent): Promise<void> {
  const { error } = await supabase.from('events').insert([{
    id: event.id,
    name: event.name,
    description: event.description,
    secret_key: event.secretKey,
    registration_status: event.registrationStatus,
    admin_id: event.adminId,
    start_date: event.startDate,
    end_date: event.endDate,
    start_time: event.startTime,
    end_time: event.endTime,
    venue: event.venue,
    address: event.address,
    contact_info: event.contactInfo,
    registration_start_date: event.registrationStartDate,
    registration_start_time: event.registrationStartTime,
    registration_end_date: event.registrationEndDate,
    registration_end_time: event.registrationEndTime,
    departments: event.departments,
    event_type: event.eventType,
    event_fee: event.eventFee,
    upi_id: event.upiId,
    payee_name: event.payeeName,
  }]);
  if (error) throw new Error(error.message);
}

export async function addUser(user: User): Promise<void> {
  const { error } = await supabase.from('users').insert([{
    id: user.id,
    name: user.name,
    unique_id: user.uniqueId,
    standard: user.standard,
    department: user.department,
    status: user.status,
    payment_status: user.paymentStatus,
    event_id: user.eventId,
    email: user.email,
    email_or_phone: user.emailOrPhone,
    phone_number: user.phoneNumber,
    whatsapp_number: user.whatsappNumber,
    entered: user.entered,
    entry_time: user.entryTime,
    exit_time: user.exitTime,
    transaction_id: user.transactionId,
    screenshot_path: user.screenshotPath,
  }]);
  if (error) throw new Error(error.message);
}

export async function addAdmin(admin: Admin): Promise<void> {
  const { error } = await supabase.from('admins').insert([{
    id: admin.id,
    name: admin.name,
    password: admin.password,
    role: admin.role,
    phone_number: admin.phoneNumber,
    has_completed_setup: admin.hasCompletedSetup,
    security_pin: admin.securityPin,
    security_question: admin.securityQuestion,
    security_answer: admin.securityAnswer,
  }]);
  if (error) throw new Error(error.message);
}

export async function addLog(log: EntryLog): Promise<void> {
  const { error } = await supabase.from('entry_logs').insert([{
    id: log.id,
    user_name: log.userName,
    unique_id: log.uniqueId,
    entry_time: log.entryTime,
    exit_time: log.exitTime,
    event_id: log.eventId,
  }]);
  if (error) throw new Error(error.message);
}

export async function addRefundRequest(request: RefundRequest): Promise<void> {
  const { error } = await supabase.from('refund_requests').insert([{
    id: request.id,
    event_id: request.eventId,
    event_name: request.eventName,
    pass_id: request.passId,
    user_id: request.userId,
    user_name: request.userName,
    full_name: request.fullName,
    email_or_phone: request.emailOrPhone,
    payment_method: request.paymentMethod,
    transaction_id: request.transactionId,
    upi_id_or_account: request.upiIdOrAccount,
    payment_date: request.paymentDate,
    amount_paid: request.amountPaid,
    reason: request.reason,
    status: request.status,
    requested_at: request.requestedAt,
    approved_at: request.approvedAt,
    paid_at: request.paidAt,
    rejection_reason: request.rejectionReason,
    refund_charge: request.refundCharge,
    final_refund_amount: request.finalRefundAmount,
    agreed_to_terms: request.agreedToTerms,
    screenshot_path: request.screenshotPath,
    event_admin_id: request.eventAdminId,
  }]);
  if (error) throw new Error(error.message);
}

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const newLogId = `audit-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from('audit_logs').insert([{
    id: newLogId,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    admin_id: log.adminId,
    timestamp: timestamp,
    details: log.details,
  }]);
  if (error) throw new Error(error.message);
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function updateUser(userId: string, updatedData: Partial<Omit<User, 'id'>>): Promise<User> {
  const payload: any = {};
  if (updatedData.name !== undefined) payload.name = updatedData.name;
  if (updatedData.uniqueId !== undefined) payload.unique_id = updatedData.uniqueId;
  if (updatedData.standard !== undefined) payload.standard = updatedData.standard;
  if (updatedData.department !== undefined) payload.department = updatedData.department;
  if (updatedData.status !== undefined) payload.status = updatedData.status;
  if (updatedData.paymentStatus !== undefined) payload.payment_status = updatedData.paymentStatus;
  if (updatedData.eventId !== undefined) payload.event_id = updatedData.eventId;
  if (updatedData.email !== undefined) payload.email = updatedData.email;
  if (updatedData.emailOrPhone !== undefined) payload.email_or_phone = updatedData.emailOrPhone;
  if (updatedData.phoneNumber !== undefined) payload.phone_number = updatedData.phoneNumber;
  if (updatedData.whatsappNumber !== undefined) payload.whatsapp_number = updatedData.whatsappNumber;
  if (updatedData.entered !== undefined) payload.entered = updatedData.entered;
  if (updatedData.entryTime !== undefined) payload.entry_time = updatedData.entryTime;
  if (updatedData.exitTime !== undefined) payload.exit_time = updatedData.exitTime;
  if (updatedData.transactionId !== undefined) payload.transaction_id = updatedData.transactionId;
  if (updatedData.screenshotPath !== undefined) payload.screenshot_path = updatedData.screenshotPath;

  const { data, error } = await supabase.from('users').update(payload).eq('id', userId).select().single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    name: data.name,
    uniqueId: data.unique_id,
    standard: data.standard,
    department: data.department,
    status: data.status,
    paymentStatus: data.payment_status,
    eventId: data.event_id,
    email: data.email,
    emailOrPhone: data.email_or_phone,
    phoneNumber: data.phone_number,
    whatsappNumber: data.whatsapp_number,
    entered: data.entered,
    entryTime: data.entry_time,
    exitTime: data.exit_time,
    transactionId: data.transaction_id,
    screenshotPath: data.screenshot_path,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  // Cascading deletes in Supabase will automatically remove users, logs, refunds if foreign keys are set.
  // But we also might want to remove associated admins if they are not Admin and not assigned elsewhere.
  const { data: event, error: fetchErr } = await supabase.from('events').select('admin_id').eq('id', eventId).single();
  
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);

  if (event?.admin_id) {
    const { data: admin } = await supabase.from('admins').select('*').eq('id', event.admin_id).single();
    if (admin && admin.role !== 'Admin') {
      const { data: otherEvents } = await supabase.from('events').select('id').eq('admin_id', event.admin_id);
      if (!otherEvents || otherEvents.length === 0) {
        await supabase.from('admins').delete().eq('id', event.admin_id);
      }
    }
  }
}

export async function updateEvent(eventId: string, updatedData: Partial<Omit<AppEvent, 'id' | 'secretKey'>>): Promise<AppEvent> {
  const payload: any = {};
  if (updatedData.name !== undefined) payload.name = updatedData.name;
  if (updatedData.description !== undefined) payload.description = updatedData.description;
  if (updatedData.registrationStatus !== undefined) payload.registration_status = updatedData.registrationStatus;
  if (updatedData.adminId !== undefined) payload.admin_id = updatedData.adminId;
  if (updatedData.startDate !== undefined) payload.start_date = updatedData.startDate;
  if (updatedData.endDate !== undefined) payload.end_date = updatedData.endDate;
  if (updatedData.startTime !== undefined) payload.start_time = updatedData.startTime;
  if (updatedData.endTime !== undefined) payload.end_time = updatedData.endTime;
  if (updatedData.venue !== undefined) payload.venue = updatedData.venue;
  if (updatedData.address !== undefined) payload.address = updatedData.address;
  if (updatedData.contactInfo !== undefined) payload.contact_info = updatedData.contactInfo;
  if (updatedData.registrationStartDate !== undefined) payload.registration_start_date = updatedData.registrationStartDate;
  if (updatedData.registrationStartTime !== undefined) payload.registration_start_time = updatedData.registrationStartTime;
  if (updatedData.registrationEndDate !== undefined) payload.registration_end_date = updatedData.registrationEndDate;
  if (updatedData.registrationEndTime !== undefined) payload.registration_end_time = updatedData.registrationEndTime;
  if (updatedData.departments !== undefined) payload.departments = updatedData.departments;
  if (updatedData.eventType !== undefined) payload.event_type = updatedData.eventType;
  if (updatedData.eventFee !== undefined) payload.event_fee = updatedData.eventFee;
  if (updatedData.upiId !== undefined) payload.upi_id = updatedData.upiId;
  if (updatedData.payeeName !== undefined) payload.payee_name = updatedData.payeeName;

  const { data, error } = await supabase.from('events').update(payload).eq('id', eventId).select().single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    secretKey: data.secret_key,
    registrationStatus: data.registration_status,
    adminId: data.admin_id,
    startDate: data.start_date,
    endDate: data.end_date,
    startTime: data.start_time,
    endTime: data.end_time,
    venue: data.venue,
    address: data.address,
    contactInfo: data.contact_info,
    registrationStartDate: data.registration_start_date,
    registrationStartTime: data.registration_start_time,
    registrationEndDate: data.registration_end_date,
    registrationEndTime: data.registration_end_time,
    departments: data.departments,
    eventType: data.event_type,
    eventFee: data.event_fee,
    upiId: data.upi_id,
    payeeName: data.payee_name
  };
}

export async function deleteAdmin(adminId: string): Promise<void> {
  const { error } = await supabase.from('admins').delete().eq('id', adminId);
  if (error) throw new Error(error.message);
}

export async function updateAdmin(adminId: string, updatedData: Partial<Omit<Admin, 'role'>>): Promise<Admin> {
  const payload: any = {};
  if (updatedData.name !== undefined) payload.name = updatedData.name;
  if (updatedData.password !== undefined) payload.password = updatedData.password;
  if (updatedData.phoneNumber !== undefined) payload.phone_number = updatedData.phoneNumber;
  if (updatedData.hasCompletedSetup !== undefined) payload.has_completed_setup = updatedData.hasCompletedSetup;
  if (updatedData.securityPin !== undefined) payload.security_pin = updatedData.securityPin;
  if (updatedData.securityQuestion !== undefined) payload.security_question = updatedData.securityQuestion;
  if (updatedData.securityAnswer !== undefined) payload.security_answer = updatedData.securityAnswer;

  const { data, error } = await supabase.from('admins').update(payload).eq('id', adminId).select().single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    name: data.name,
    password: data.password,
    role: data.role,
    phoneNumber: data.phone_number,
    hasCompletedSetup: data.has_completed_setup,
    securityPin: data.security_pin,
    securityQuestion: data.security_question,
    securityAnswer: data.security_answer,
  };
}

export async function updateRefund(refundId: string, updatedData: Partial<Omit<RefundRequest, 'id'>>): Promise<RefundRequest> {
  const payload: any = {};
  if (updatedData.eventId !== undefined) payload.event_id = updatedData.eventId;
  if (updatedData.eventName !== undefined) payload.event_name = updatedData.eventName;
  if (updatedData.passId !== undefined) payload.pass_id = updatedData.passId;
  if (updatedData.userId !== undefined) payload.user_id = updatedData.userId;
  if (updatedData.userName !== undefined) payload.user_name = updatedData.userName;
  if (updatedData.fullName !== undefined) payload.full_name = updatedData.fullName;
  if (updatedData.emailOrPhone !== undefined) payload.email_or_phone = updatedData.emailOrPhone;
  if (updatedData.paymentMethod !== undefined) payload.payment_method = updatedData.paymentMethod;
  if (updatedData.transactionId !== undefined) payload.transaction_id = updatedData.transactionId;
  if (updatedData.upiIdOrAccount !== undefined) payload.upi_id_or_account = updatedData.upiIdOrAccount;
  if (updatedData.paymentDate !== undefined) payload.payment_date = updatedData.paymentDate;
  if (updatedData.amountPaid !== undefined) payload.amount_paid = updatedData.amountPaid;
  if (updatedData.reason !== undefined) payload.reason = updatedData.reason;
  if (updatedData.status !== undefined) payload.status = updatedData.status;
  if (updatedData.requestedAt !== undefined) payload.requested_at = updatedData.requestedAt;
  if (updatedData.approvedAt !== undefined) payload.approved_at = updatedData.approvedAt;
  if (updatedData.paidAt !== undefined) payload.paid_at = updatedData.paidAt;
  if (updatedData.rejectionReason !== undefined) payload.rejection_reason = updatedData.rejectionReason;
  if (updatedData.refundCharge !== undefined) payload.refund_charge = updatedData.refundCharge;
  if (updatedData.finalRefundAmount !== undefined) payload.final_refund_amount = updatedData.finalRefundAmount;
  if (updatedData.agreedToTerms !== undefined) payload.agreed_to_terms = updatedData.agreedToTerms;
  if (updatedData.screenshotPath !== undefined) payload.screenshot_path = updatedData.screenshotPath;
  if (updatedData.eventAdminId !== undefined) payload.event_admin_id = updatedData.eventAdminId;

  const { data, error } = await supabase.from('refund_requests').update(payload).eq('id', refundId).select().single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    eventId: data.event_id,
    eventName: data.event_name,
    passId: data.pass_id,
    userId: data.user_id,
    userName: data.user_name,
    fullName: data.full_name,
    emailOrPhone: data.email_or_phone,
    paymentMethod: data.payment_method,
    transactionId: data.transaction_id,
    upiIdOrAccount: data.upi_id_or_account,
    paymentDate: data.payment_date,
    amountPaid: data.amount_paid,
    reason: data.reason,
    status: data.status,
    requestedAt: data.requested_at,
    approvedAt: data.approved_at,
    paidAt: data.paid_at,
    rejectionReason: data.rejection_reason,
    refundCharge: data.refund_charge,
    finalRefundAmount: data.final_refund_amount,
    agreedToTerms: data.agreed_to_terms,
    screenshotPath: data.screenshot_path,
    eventAdminId: data.event_admin_id,
  };
}
