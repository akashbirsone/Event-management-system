

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { 
  getUsers, 
  getEvents, 
  deleteUser, 
  deleteEvent, 
  updateUser, 
  updateEvent, 
  addUser, 
  addEvent, 
  addLog,
  getAdmins,
  addAdmin as addAdminToData,
  deleteAdmin,
  addRefundRequest,
  getRefunds,
  updateRefund,
  updateAdmin,
  addAuditLog,
} from './data';
import type { User, AppEvent, EntryLog, Admin, RefundRequest, AuditLog } from './definitions';
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';


const loginSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  adminId: z.string().min(1, 'Admin ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginState = {
  errors?: {
    role?: string[];
    adminId?: string[];
    password?: string[];
  };
  message?: string;
  success?: boolean;
  adminId?: string;
} | null;


export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid submission.',
    };
  }

  const { adminId, password, role } = validatedFields.data;
  const admins = await getAdmins();
  
  const admin = admins.find(a => a.id === adminId && a.password === password && a.role === role);

  if (admin) {
    revalidatePath('/admin');
    return { success: true, adminId: admin.id, message: 'Login successful!' };
  } else {
    return {
      message: 'Invalid credentials. Please check your Role, ID, and Password.',
    };
  }
}

const getPassSchema = z.object({
  identifier: z.string().min(1, 'Unique ID is required'),
});

type GetPassState = {
    user?: User;
    event?: AppEvent;
    message: string | null;
    errors?: { identifier?: string[] };
    info?: string | null;
};


export async function getPassAction(prevState: any, formData: FormData): Promise<GetPassState> {
  const validatedFields = getPassSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: null,
    };
  }

  const { identifier } = validatedFields.data;
  const users = await getUsers();
  const user = users.find((u) => u.uniqueId.toLowerCase() === identifier.toLowerCase());

  if (!user) {
    return { message: 'No user found with that Pass ID. Please check the ID and try again.' };
  }
  
  const event = (await getEvents()).find(e => e.id === user.eventId);
  if (!event) {
     return { message: 'The event associated with this pass could not be found. It may have been cancelled.', user };
  }

  if (user.paymentStatus === 'Refund In Progress') {
    return { message: 'You have already submitted a refund request for this event. Pass download is disabled until the refund is processed.' };
  }
  if (user.paymentStatus === 'Refunded') {
    return { message: 'Your pass is invalid because the payment has been refunded.', user };
  }
  if (event.eventType === 'Paid' && user.paymentStatus !== 'Paid') {
    return { message: 'Your payment for this event is pending or has not been verified. Please wait for admin approval.', user };
  }

  if (user.status === 'Pending') {
    return { message: 'Your registration is pending approval. Please check back later.', user };
  }

  if (user.status === 'Rejected') {
    return { message: 'Your registration request for this event has been rejected. Please contact the event organizer for more details.', user };
  }

  return { user, event, message: null, errors: undefined };
}


export async function validateQrAction(qrDataString: string, scanningAdminId: string | null): Promise<{ status: 'success' | 'invalid' | 'error' | 'already_scanned', message: string, user?: User, event?: AppEvent, eventAdmin?: Admin }> {
    if (!scanningAdminId) {
        return { status: 'error', message: 'Scanning admin not identified. Please log in again.' };
    }

    const allAdmins = await getAdmins();
    const scanningAdmin = allAdmins.find(a => a.id === scanningAdminId);

    if (!scanningAdmin) {
        return { status: 'error', message: 'Scanning admin is not a valid administrator.' };
    }

    let userId: string | undefined;
    try {
        const path = qrDataString.startsWith('http') ? new URL(qrDataString).pathname : qrDataString;
        const pathParts = path.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'pass') {
            userId = pathParts[2];
        } else {
            return { status: 'invalid', message: 'QR Code contains an invalid URL format.' };
        }
    } catch (error) {
        return { status: 'error', message: 'Invalid QR Code format. Expected a URL path.' };
    }
    

    if (!userId) {
        return { status: 'invalid', message: 'Could not extract User ID from QR Code.' };
    }

    const user = (await getUsers()).find((u) => u.id === userId);

    if (!user) {
        return { status: 'invalid', message: `User with ID ${userId} not found.` };
    }

    const event = (await getEvents()).find(e => e.id === user.eventId);

    if (!event) {
        return { status: 'invalid', message: `Event for user ${user.name} not found.` };
    }
    
    // Authorization Check for Event Admins
    if (scanningAdmin.role === 'EventsManager' && event.adminId !== scanningAdmin.id) {
        await addAuditLog({
            action: 'STATUS_CHANGE',
            entityType: 'USER',
            entityId: user.id,
            adminId: scanningAdminId,
            details: `Unauthorized scan attempt by ${scanningAdmin.name} for user ${user.name} at event ${event.name}.`,
        });
        return { status: 'invalid', message: 'Access Denied: You cannot scan passes from other events.' };
    }
    
    // Business Logic Checks (Refund, Status)
    if (user.paymentStatus === 'Refunded') {
        return { status: 'invalid', message: 'User payment has been refunded. Access denied.', user, event };
    }
    if (user.paymentStatus === 'Refund In Progress') {
        return { status: 'invalid', message: 'Refund already requested for this user. Entry denied.', user, event };
    }
    if (user.status !== 'Approved') {
        return { status: 'invalid', message: `User ${user.name} is not approved for this event. Status: ${user.status}`, user, event };
    }

    const eventAdmin = allAdmins.find(a => a.id === event.adminId);
    
    // One-time scan logic for Event Admin
    if (scanningAdmin.role === 'EventsManager') {
        if (user.entered) {
             return { status: 'already_scanned', message: 'Already Scanned — This user’s pass has been verified.', user, event };
        }
    }
    
    // Main Admin can re-scan, just show info.
    if (scanningAdmin.role === 'Admin' && user.entered) {
        await addAuditLog({
            action: 'STATUS_CHANGE',
            entityType: 'USER',
            entityId: user.id,
            adminId: scanningAdminId,
            details: `User ${user.name} was RE-SCANNED by Main Admin ${scanningAdmin.name}.`,
        });
         return {
            status: 'success',
            message: 'Pass Re-verified Successfully.',
            user,
            event,
            eventAdmin: eventAdmin,
        };
    }

    // First successful scan for either role
    const entryTime = new Date().toISOString();
    await updateUser(user.id, { entered: true, entryTime: entryTime });
    await addLog({
        id: `log-${Date.now()}`,
        userName: user.name,
        uniqueId: user.uniqueId,
        entryTime: entryTime,
        eventId: user.eventId,
    });
    await addAuditLog({
        action: 'STATUS_CHANGE',
        entityType: 'USER',
        entityId: user.id,
        adminId: scanningAdminId,
        details: `User ${user.name} was scanned and checked-in by ${scanningAdmin.name}.`,
    });
    
    revalidatePath('/admin/logs');
    revalidatePath('/admin');
    revalidatePath('/admin/audit-log');

    const updatedUser = (await getUsers()).find(u => u.id === userId)!;

    return {
        status: 'success',
        message: 'Pass Verified Successfully.',
        user: updatedUser,
        event,
        eventAdmin: scanningAdmin.role === 'Admin' ? eventAdmin : undefined,
    };
}



const eventSchemaBase = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  registrationStatus: z.enum(['Open', 'Closed']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  departments: z.string().optional(),
  registrationStartDate: z.string().optional(),
  registrationEndDate: z.string().optional(),
  registrationStartTime: z.string().optional(),
  registrationEndTime: z.string().optional(),
  eventType: z.enum(['Free', 'Paid']),
  payeeName: z.string().optional(),
  eventFee: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0, 'Fee must be a positive number.').optional()
  ),
  upiId: z.string().optional(),
});


const createEventAdminSchema = z.object({
  newAdminName: z.string().optional(),
  newAdminId: z.string().optional(),
  newAdminPassword: z.string().optional(),
  newAdminPhone: z.string().optional(),
});

const createEventSchema = z.object({
    creatorId: z.string(),
  }).merge(eventSchemaBase).merge(createEventAdminSchema)
  .superRefine((data, ctx) => {
  if (data.eventType === 'Paid' && (data.eventFee === undefined || data.eventFee <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Event fee is required for paid events and must be greater than 0.",
      path: ["eventFee"],
    });
  }
   if (data.eventType === 'Paid' && (!data.upiId || data.upiId.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "UPI ID is required for paid events.",
      path: ["upiId"],
    });
  }
  if (data.newAdminName || data.newAdminId || data.newAdminPassword) {
    if (!data.newAdminName || !data.newAdminId || !data.newAdminPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'To create a new admin, you must provide a Name, Login ID, and Password.',
        path: ['newAdminName'],
      });
    }
  }
});


const updateEventSchema = eventSchemaBase.extend({
  eventId: z.string(),
}).superRefine((data, ctx) => {
    if (data.eventType === 'Paid') {
        if (data.eventFee === undefined || data.eventFee <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Event fee is required for paid events and must be greater than 0.",
                path: ["eventFee"],
            });
        }
        if (!data.upiId || data.upiId.trim() === '') {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "UPI ID is required for paid events.",
                path: ["upiId"],
            });
        }
    }
});


export async function createEventAction(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());

   if (rawData.start_time_hr && rawData.start_time_min && rawData.start_time_ampm) {
    rawData.startTime = `${rawData.start_time_hr}:${rawData.start_time_min} ${rawData.start_time_ampm}`;
  }
  if (rawData.reg_start_time_hr && rawData.reg_start_time_min && rawData.reg_start_time_ampm) {
     rawData.registrationStartTime = `${rawData.reg_start_time_hr}:${rawData.reg_start_time_min} ${rawData.reg_start_time_ampm}`;
  }
  if (rawData.reg_end_time_hr && rawData.reg_end_time_min && rawData.reg_end_time_ampm) {
      rawData.registrationEndTime = `${rawData.reg_end_time_hr}:${rawData.reg_end_time_min} ${rawData.reg_end_time_ampm}`;
  }


  const validatedFields = createEventSchema.safeParse(rawData);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create event. Please check the fields.',
    };
  }

  const { creatorId, newAdminName, newAdminId, newAdminPassword, newAdminPhone, departments, eventType, eventFee, upiId, payeeName, ...eventData } = validatedFields.data;

  const allAdmins = await getAdmins();
  const creator = allAdmins.find(a => a.id === creatorId);

  if (!creator) {
    return { success: false, message: 'Unauthorized action: Creator not found.' };
  }
  
  let finalAdminId = creatorId;

  // Only a SuperAdmin can create a new EventsManager
  if (creator.role === 'Admin' && newAdminId && newAdminName && newAdminPassword) {
     if (allAdmins.some(admin => admin.id === newAdminId)) {
        return { success: false, message: `Admin ID "${newAdminId}" is already taken.` };
    }
    const newAdmin: Admin = {
      id: newAdminId,
      name: newAdminName,
      password: newAdminPassword,
      role: 'EventsManager',
      phoneNumber: newAdminPhone || '',
    };
    await addAdminToData(newAdmin);
    finalAdminId = newAdminId;
  }
  
  const finalEventData: Partial<AppEvent> = { 
      ...eventData,
      eventType: eventType,
      eventFee: eventType === 'Paid' ? eventFee : 0,
      upiId: eventType === 'Paid' ? upiId : undefined,
      payeeName: eventType === 'Paid' ? (payeeName || 'EventPass') : undefined,
    };
  if (typeof departments === 'string' && departments.trim() !== '') {
    finalEventData.departments = departments.split(',').map(d => d.trim()).filter(Boolean);
  } else {
     finalEventData.departments = [];
  }


  const newEvent: AppEvent = {
    id: `evt-${Date.now()}`,
    name: eventData.name,
    description: eventData.description || '',
    secretKey: `secret-${Math.random().toString(36).substring(2, 10)}`,
    adminId: finalAdminId,
    registrationStatus: eventData.registrationStatus,
    contactInfo: creator.phoneNumber || '9561274934',
    ...finalEventData
  };

  await addEvent(newEvent);

  await addAuditLog({
    action: 'CREATE',
    entityType: 'EVENT',
    entityId: newEvent.id,
    adminId: creatorId,
    details: `Event "${newEvent.name}" was created.`,
  });

  revalidatePath('/admin/events');
  revalidatePath('/admin/users');
  
  return {
    success: true,
    message: 'Event created successfully!',
    event: newEvent,
  };
}


export async function updateEventAction(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());

  if (rawData.start_time_hr && rawData.start_time_min && rawData.start_time_ampm) {
    rawData.startTime = `${rawData.start_time_hr}:${rawData.start_time_min} ${rawData.start_time_ampm}`;
  }
  if (rawData.reg_start_time_hr && rawData.reg_start_time_min && rawData.reg_start_time_ampm) {
     rawData.registrationStartTime = `${rawData.reg_start_time_hr}:${rawData.reg_start_time_min} ${rawData.reg_start_time_ampm}`;
  }
  if (rawData.reg_end_time_hr && rawData.reg_end_time_min && rawData.reg_end_time_ampm) {
      rawData.registrationEndTime = `${rawData.reg_end_time_hr}:${rawData.reg_end_time_min} ${rawData.reg_end_time_ampm}`;
  }

  const validatedFields = updateEventSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to update event. Please check the fields.',
    };
  }
  
  const { eventId, departments, eventType, eventFee, upiId, payeeName, ...eventData } = validatedFields.data;
  
  const finalEventData: Partial<AppEvent> = { 
    ...eventData,
    eventType: eventType,
    eventFee: eventType === 'Paid' ? eventFee : 0,
    upiId: eventType === 'Paid' ? upiId : undefined,
    payeeName: eventType === 'Paid' ? (payeeName || 'EventPass') : undefined,
  };


  if (typeof departments === 'string' && departments.trim() !== '') {
    finalEventData.departments = departments.split(',').map(d => d.trim()).filter(Boolean);
  } else {
     finalEventData.departments = [];
  }


  try {
    const updated = await updateEvent(eventId, finalEventData);
    revalidatePath('/admin/events');
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    revalidatePath(`/pass/${eventId}`);
    revalidatePath(`/admin/users/[^/]+/pass`, 'layout');


    return {
      success: true,
      message: 'Event updated successfully!',
      event: updated,
    };
  } catch (error) {
     return {
      success: false,
      message: 'Failed to update event.',
    };
  }
}

const addUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  standard: z.string().min(1, "Class is required"),
  department: z.string().min(1, "Department is required"),
  phoneNumber: z.string().length(10, "Contact number must be 10 digits.").optional().or(z.literal('')),
  email: z.string().email("Invalid email address"),
  eventId: z.string(),
  paymentStatus: z.enum(['Paid', 'Pending', 'Unpaid']).optional(),
});


export async function addUserAction(prevState: any, formData: FormData) {
  const validatedFields = addUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to add user. Please check the fields.',
    };
  }

  const { name, eventId, email, phoneNumber, paymentStatus, ...otherData } = validatedFields.data;
  const users = await getUsers();
  
  if (email) {
    const existingUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.eventId === eventId);
    if (existingUser) {
        return { success: false, message: 'A user with this email already exists for this event.' };
    }
  }
  if (phoneNumber) {
      const existingUser = users.find(u => u.phoneNumber === phoneNumber && u.eventId === eventId);
       if (existingUser) {
        return { success: false, message: 'A user with this phone number already exists for this event.' };
    }
  }
  
  const events = await getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  const eventNameFirstLetter = event.name.charAt(0).toUpperCase();
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const finalUniqueId = `${eventNameFirstLetter}${randomDigits}`;

  let finalPaymentStatus: User['paymentStatus'];
  let finalStatus: User['status'];

  if (event.eventType === 'Paid') {
    finalPaymentStatus = paymentStatus || 'Pending';
    finalStatus = finalPaymentStatus === 'Paid' ? 'Approved' : 'Pending';
  } else {
    finalPaymentStatus = 'Unpaid'; // Explicitly set for free events
    finalStatus = 'Approved';
  }


  const newUser: User = {
    id: `usr-${Date.now()}`,
    uniqueId: finalUniqueId,
    name,
    eventId,
    email,
    phoneNumber,
    standard: otherData.standard,
    department: otherData.department,
    status: finalStatus, 
    paymentStatus: finalPaymentStatus,
    entered: false,
  };

  await addUser(newUser);
  revalidatePath('/admin/users');
  revalidatePath('/admin');

  return {
    success: true,
    message: `Successfully added ${name}. Their Pass ID is ${newUser.uniqueId}.`,
    user: newUser
  };
}

const csvUserSchema = z.object({
    name: z.string(),
    uniqueId: z.string().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    whatsappNumber: z.string().optional(),
    standard: z.string().optional(),
    department: z.string().optional(),
});

export async function addUsersFromCsvAction(prevState: any, formData: FormData) {
  const csvDataString = formData.get('csvData') as string;
  const eventId = formData.get('eventId') as string;

  if (!csvDataString || !eventId) {
    return { success: false, message: 'Missing CSV data or Event ID.' };
  }

  try {
    const jsonData = JSON.parse(csvDataString);
    const usersToInsert = z.array(csvUserSchema).parse(jsonData);

    const events = await getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, message: 'Event not found.' };
    }
    const eventNameFirstLetter = event.name.charAt(0).toUpperCase();


    for (const u of usersToInsert) {
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const newUser: User = {
            id: `usr-${Date.now()}-${u.name.replace(/\s/g, '')}`,
            uniqueId: u.uniqueId || `${eventNameFirstLetter}${randomDigits}`,
            name: u.name,
            email: u.email,
            phoneNumber: u.phoneNumber,
            standard: u.standard || 'N/A',
            department: u.department || 'N/A',
            eventId,
            status: 'Approved',
            paymentStatus: event.eventType === 'Paid' ? 'Paid' : 'Unpaid',
            entered: false,
        };
        await addUser(newUser);
    }
    
    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return { success: true, message: `Successfully added ${usersToInsert.length} users.`};

  } catch (error) {
    console.error('CSV processing error:', error);
    if (error instanceof z.ZodError) {
        return { success: false, message: `CSV validation failed: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { success: false, message: 'Failed to process CSV file. Make sure it is formatted correctly with columns: name, phoneNumber, email, standard, department.' };
  }
}

const removeUserSchema = z.object({
  userId: z.string(),
});

export async function removeUserAction(prevState: any, formData: FormData) {
  const validatedFields = removeUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid user ID.',
    };
  }

  const { userId } = validatedFields.data;

  try {
    await deleteUser(userId);
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return {
      success: true,
      message: 'User removed successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove user.',
    };
  }
}

const removeEventSchema = z.object({
  eventId: z.string(),
});

export async function removeEventAction(prevState: any, formData: FormData) {
  const validatedFields = removeEventSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid event ID.',
    };
  }

  const { eventId } = validatedFields.data;

  try {
    await deleteEvent(eventId);
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    revalidatePath('/admin/logs');
    revalidatePath('/admin/events');

    return {
      success: true,
      message: 'Event and all its users removed successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove event.',
    };
  }
}

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().length(10, "Contact number must be exactly 10 digits.").refine(val => /^[6-9]\d{9}$/.test(val), {
    message: "Invalid contact number. Must be 10 digits and start with 6, 7, 8, or 9.",
  }),
  standard: z.string().min(1, "Class is required"),
  department: z.string().min(1, "Department is required"),
  email: z.string().email("A valid email is required"),
  eventId: z.string().min(1, "Please select an event."),
  transactionId: z.string().optional(),
  paymentStep: z.string().optional(),
  screenshot: z.instanceof(File).optional(),
});

const paymentStepSchema = registrationSchema.extend({
  paymentStep: z.literal("true"),
  transactionId: z.string().min(1, "A valid transaction ID is required."),
});


export async function registerUserAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const isPaymentStep = rawData.paymentStep === 'true';

    const validatedFields = isPaymentStep 
        ? paymentStepSchema.safeParse(rawData)
        : registrationSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please check the fields and try again.",
      paymentRequired: isPaymentStep, // Keep user on payment screen
      user: isPaymentStep ? {
          name: rawData.name as string,
          phoneNumber: rawData.phoneNumber as string,
          standard: rawData.standard as string,
          department: rawData.department as string,
          email: rawData.email as string,
          eventId: rawData.eventId as string,
      } : undefined,
      event: isPaymentStep ? (await getEvents()).find(e => e.id === rawData.eventId) : undefined,
    };
  }
  
  const { name, phoneNumber, standard, email, department, eventId, transactionId, paymentStep, screenshot } = validatedFields.data;

  let events = await getEvents();
  const selectedEvent = events.find(e => e.id === eventId);

  if (!selectedEvent) {
    return { success: false, message: "The selected event could not be found." };
  }
  
  if (selectedEvent.registrationStatus === 'Closed') {
    return { success: false, message: "Sorry, registration for this event is currently closed." };
  }

  const users = await getUsers();
  if (!paymentStep) {
    const existingUser = users.find(u => u.eventId === eventId && (
        (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
        (u.phoneNumber && phoneNumber && u.phoneNumber === phoneNumber)
    ));
    if (existingUser) {
      return { 
        success: false, 
        message: 'You have already registered for this event. You can register for each event only once.'
      };
    }
  }
  
  // Handle Paid Event Logic
  if (selectedEvent.eventType === 'Paid' && !paymentStep) {
    const tempUser: Omit<User, 'id' | 'uniqueId' | 'status' | 'entered' | 'paymentStatus' > = {
      name, phoneNumber, standard, department, email, eventId
    };
     return { 
        success: true,
        paymentRequired: true, 
        user: tempUser, 
        event: selectedEvent,
    };
  }
  
  const eventNameFirstLetter = selectedEvent.name.charAt(0).toUpperCase();
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const uniqueId = `${eventNameFirstLetter}${randomDigits}`;

  if (selectedEvent.eventType === 'Paid' && transactionId) {
      const existingTransaction = users.find(u => u.eventId === selectedEvent.id && u.transactionId === transactionId);
      if (existingTransaction) {
          return {
              success: false,
              paymentRequired: true,
              user: { name: name as string, phoneNumber: phoneNumber as string, standard: standard as string, department: department as string, email: email as string, eventId: eventId as string },
              event: selectedEvent,
              errors: { transactionId: ["This transaction ID has already been used."] },
              message: 'This transaction ID has already been used.'
          };
      }
  }

  let screenshotPath: string | undefined;
  if (screenshot && screenshot.size > 0) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await screenshot.arrayBuffer());
    const filename = `${uniqueId}-${Date.now()}-${screenshot.name}`;
    screenshotPath = path.join(uploadsDir, filename);
    await fs.writeFile(screenshotPath, buffer);
    screenshotPath = `/uploads/${filename}`; // Store web-accessible path
  }


  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    uniqueId,
    phoneNumber: phoneNumber,
    standard,
    department,
    email,
    eventId: selectedEvent.id,
    status: 'Pending',
    paymentStatus: selectedEvent.eventType === 'Paid' ? 'Pending' : 'Unpaid',
    transactionId: transactionId,
    entered: false,
    screenshotPath,
  };

  await addUser(newUser);
  revalidatePath('/admin/users');
  revalidatePath('/admin');

  return {
    success: true,
    uniqueId: uniqueId,
    message: 'Registration successful! Your unique Pass ID is displayed below.'
  };
}

const updateUserStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(['Approved', 'Rejected']),
});

export async function updateUserStatusAction(prevState: any, formData: FormData) {
  const validatedFields = updateUserStatusSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input.',
    };
  }

  const { userId, status } = validatedFields.data;

  try {
      await updateUser(userId, { status });
      revalidatePath('/admin/users');
      revalidatePath('/admin');

      return { success: true, message: `User status updated to ${status}.` };
  } catch (error) {
      return { success: false, message: 'An error occurred while updating user status.' };
  }
}

export async function updateUserPaymentStatusAction(userId: string, paymentStatus: 'Paid' | 'Unpaid') {
    try {
        const user = (await getUsers()).find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found.' };
        }
        
        let newStatus: User['status'] = user.status;
        if (paymentStatus === 'Paid') {
            newStatus = 'Approved';
        } else if (paymentStatus === 'Unpaid') {
            newStatus = 'Rejected';
        }
        
        await updateUser(userId, { paymentStatus, status: newStatus });
        revalidatePath('/admin/users');
        revalidatePath('/admin');
        return { success: true, message: `User payment status updated to ${paymentStatus}.` };
    } catch (error) {
         return { success: false, message: 'An error occurred while updating payment status.' };
    }
}


export async function updateEventStatusAction(eventId: string, status: 'Open' | 'Closed') {
    try {
        await updateEvent(eventId, { registrationStatus: status });
        revalidatePath('/admin/events');
        revalidatePath('/register');
        return { success: true, message: `Event registration status updated to ${status}.` };
    } catch (error) {
        return { success: false, message: 'An error occurred while updating event status.' };
    }
}

const addAdminSchema = z.object({
  id: z.string().min(1, "Login ID is required"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["Admin", "EventsManager"]),
  phoneNumber: z.string().optional(),
});

export async function addAdminAction(prevState: any, formData: FormData) {
  const validatedFields = addAdminSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to add admin. Please check the fields.',
    };
  }
  
  const { id, name, password, role, phoneNumber } = validatedFields.data;
  
  const admins = await getAdmins();
  if (admins.some(admin => admin.id.toLowerCase() === id.toLowerCase())) {
    return { success: false, message: `Admin with ID "${id}" already exists.` };
  }

  const newAdmin: Admin = { id, name, password, role, phoneNumber };

  await addAdminToData(newAdmin);
  revalidatePath('/admin/admins');

  return {
    success: true,
    message: 'Events Manager added successfully!',
  };
}

const removeAdminSchema = z.object({
  adminId: z.string(),
});

export async function removeAdminAction(prevState: any, formData: FormData) {
  const validatedFields = removeAdminSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid admin ID.' };
  }

  const { adminId } = validatedFields.data;

  try {
    const admins = await getAdmins();
    const adminToRemove = admins.find(a => a.id === adminId);
    if (adminToRemove?.role === 'Admin') {
      return { success: false, message: 'Cannot remove a Main Admin account.' };
    }
    await deleteAdmin(adminId);
    revalidatePath('/admin/admins');
    return { success: true, message: 'Admin removed successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to remove admin.' };
  }
}

const refundRequestSchema = z.object({
  passId: z.string().min(1, 'Pass ID is required.'),
  eventId: z.string().min(1, 'Please select an event.'),
  fullName: z.string().min(1),
  emailOrPhone: z.string().min(1),
  amountPaid: z.preprocess((val) => Number(val), z.number()),
  paymentMethod: z.enum(['GPay', 'PhonePe', 'Paytm']),
  upiIdOrAccount: z.string().min(3, { message: 'A valid UPI ID is required.'}),
  transactionId: z.string().optional(),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters).'),
  agreedToTerms: z.literal('on', {
    errorMap: () => ({ message: 'You must agree to the terms and conditions.' }),
  }),
});


function getRefundCharge(amount: number): { percentage: number; charge: number; finalAmount: number } {
  let percentage = 0;
  if (amount >= 100 && amount <= 200) percentage = 10;
  else if (amount >= 201 && amount <= 500) percentage = 7;
  else if (amount >= 501 && amount <= 1000) percentage = 5;
  else if (amount > 1000) percentage = 2;

  const charge = Math.round((amount * percentage) / 100);
  const finalAmount = amount - charge;
  return { percentage, charge, finalAmount };
}

export async function requestRefundAction(prevState: any, formData: FormData) {
  const validatedFields = refundRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please correct the errors and try again.',
    };
  }

  const { passId, eventId, reason, fullName, emailOrPhone, amountPaid, paymentMethod, upiIdOrAccount, transactionId } = validatedFields.data;

  const users = await getUsers();
  const user = users.find(u => u.uniqueId.toLowerCase() === passId.toLowerCase() && u.eventId === eventId);
  
  if (!user) {
    return { success: false, message: "No user found with this Pass ID for the selected event." };
  }
  
  if (!user.transactionId) {
    return { success: false, message: "Only users with a recorded Transaction ID can request a refund." };
  }
  
  const existingRefunds = await getRefunds();
  const recentUserRequest = existingRefunds
    .filter(r => r.userId === user.id && r.eventId === eventId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];

  if (recentUserRequest) {
      const fortyEightHours = 48 * 60 * 60 * 1000;
      const timeSinceLastRequest = new Date().getTime() - new Date(recentUserRequest.requestedAt).getTime();
      
      if (timeSinceLastRequest < fortyEightHours) {
          return { 
            success: false, 
            message: "You have already submitted a refund request for this event. You can submit a new request in 48 hours from your previous request.",
            cooldown: true,
            lastRequestTimestamp: recentUserRequest.requestedAt,
          };
      }
  }

  const event = (await getEvents()).find(e => e.id === eventId);
  if (!event || !event.eventFee) {
    return { success: false, message: "The selected event could not be found or has no fee." };
  }

  const { charge, finalAmount } = getRefundCharge(event.eventFee);

  const newRefundRequest: RefundRequest = {
    id: `ref-${Date.now()}`,
    eventId: event.id,
    eventName: event.name,
    passId: user.uniqueId,
    userId: user.id,
    userName: user.name,
    fullName: fullName,
    emailOrPhone: emailOrPhone,
    paymentMethod: paymentMethod,
    transactionId: user.transactionId,
    upiIdOrAccount: upiIdOrAccount,
    paymentDate: 'N/A', // Assuming not collected at registration
    amountPaid: event.eventFee,
    refundCharge: charge,
    finalRefundAmount: finalAmount,
    reason: reason,
    agreedToTerms: true,
    status: 'Pending',
    requestedAt: new Date().toISOString(),
    screenshotPath: user.screenshotPath,
    eventAdminId: event.adminId,
  };

  await addRefundRequest(newRefundRequest);
  
  // Mark user's pass as under review
  await updateUser(user.id, { paymentStatus: 'Refund In Progress' });

  revalidatePath('/admin/refunds');
  revalidatePath(`/pass/${user.id}`);
  revalidatePath('/admin/users');

  return {
    success: true,
    message: 'Refund request submitted successfully. Your pass is now temporarily inactive pending review.',
  };
}

const updateRefundStatusSchema = z.object({
  refundId: z.string(),
  status: z.enum(['Approved', 'Rejected', 'Paid', 'Under Review']),
  rejectionReason: z.string().optional(),
});

export async function updateRefundStatusAction(prevState: any, formData: FormData) {
    const validatedFields = updateRefundStatusSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid input for updating refund status.',
        };
    }

    const { refundId, status, rejectionReason } = validatedFields.data;

    try {
        const refunds = await getRefunds();
        const refundRequest = refunds.find(r => r.id === refundId);
        if (!refundRequest) {
            throw new Error('Refund request not found.');
        }

        const updateData: Partial<RefundRequest> = { status };
        if (status === 'Rejected') {
            if (!rejectionReason) {
              return {
                  success: false,
                  message: 'A reason is required to reject a refund request.'
              };
            }
            updateData.rejectionReason = rejectionReason;
            // Reactivate user's pass
            await updateUser(refundRequest.userId, { paymentStatus: 'Paid', status: 'Approved' });

        }
        if (status === 'Approved') {
            updateData.approvedAt = new Date().toISOString();
        }
        if (status === 'Paid') {
            updateData.paidAt = new Date().toISOString();
            
            // Delete the screenshot file if it exists, now that it's paid
            if (refundRequest.screenshotPath) {
                const filePath = path.join(process.cwd(), 'public', refundRequest.screenshotPath);
                try {
                    await fs.unlink(filePath);
                } catch (err) {
                    console.error(`Failed to delete screenshot ${filePath}:`, err);
                }
            }
            // Clear the path from the record regardless
            updateData.screenshotPath = undefined;
            // Mark user as refunded
            await updateUser(refundRequest.userId, {
                status: 'Rejected',
                paymentStatus: 'Refunded'
            });
        }


        await updateRefund(refundId, updateData);
        
        revalidatePath('/admin/refunds');
        revalidatePath('/admin/users');
        revalidatePath(`/pass/${refundRequest.userId}`);
        revalidatePath('/admin');

        return {
            success: true,
            updatedStatus: status,
            message: `Refund request has been successfully updated to ${status}.`
        };

    } catch (error) {
        let message = 'An unknown error occurred.';
        if (error instanceof Error) {
            message = error.message;
        }
        return {
            success: false,
            message: `Failed to update refund status: ${message}`
        };
    }
}


const checkRefundStatusSchema = z.object({
  passId: z.string().min(1, 'Unique Pass ID is required.'),
  context: z.enum(['status', 'refund']).optional(),
});

export async function checkRefundStatusAction(prevState: any, formData: FormData) {
    const validatedFields = checkRefundStatusSchema.safeParse(Object.fromEntries(formData.entries()));
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Please provide a valid Pass ID.',
        };
    }

    const { passId, context } = validatedFields.data;
    const users = await getUsers();
    const user = users.find(u => u.uniqueId.toLowerCase() === passId.toLowerCase());

    if (!user) {
        return { message: 'No registration found for this Pass ID.' };
    }

    const allRefunds = await getRefunds();
    const userRequests = allRefunds.filter(r => r.userId === user.id);
    
    const paidRequest = userRequests.find(r => r.status === 'Paid');
    if (paidRequest) {
        return {
            paymentReturned: true,
            paidAt: paidRequest.paidAt,
            message: "Payment returned successfully to your account."
        }
    }


    // This block handles the initial check on the refund page
    if (context === 'refund') {
        const recentUserRequest = userRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
        
        if (recentUserRequest) {
            const fortyEightHours = 48 * 60 * 60 * 1000;
            const timeSinceLastRequest = new Date().getTime() - new Date(recentUserRequest.requestedAt).getTime();
            
            if (timeSinceLastRequest < fortyEightHours) {
                return { 
                    message: "You have already submitted a refund request for this event. You can submit a new request in 48 hours from your previous request.",
                    cooldown: true,
                    lastRequestTimestamp: recentUserRequest.requestedAt,
                };
            }
        }
        
        const userEvents = (await getEvents()).filter(e => e.id === user.eventId && e.eventType === 'Paid');
        if (userEvents.length === 0) {
            return { message: 'This Pass ID is not associated with any paid events eligible for a refund.' };
        }
        return { user, events: userEvents };
    }
    
    // This block handles the "Check Status" tab
    if (userRequests.length === 0) {
        return {
            message: 'No refund requests found for this Pass ID.',
        };
    }

    return {
        requests: userRequests,
        message: `Found ${userRequests.length} request(s).`
    };
}


const updateAdminCredentialsSchema = z.object({
    loggedInAdminId: z.string().min(1, { message: "Logged in admin ID is missing." }),
    verificationUid: z.string().length(12, { message: "Verification UID must be 12 digits." }),
    currentPassword: z.string().min(1, { message: "Current Password is required." }),
    newAdminId: z.string().length(12, { message: "New Admin ID must be exactly 12 digits." }).regex(/^\d+$/, { message: "New Admin ID must only contain numbers." }),
    newPassword: z.string().min(6, { message: "New Password must be at least 6 characters." }),
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match.",
    path: ["confirmNewPassword"],
});

export async function updateAdminCredentialsAction(prevState: any, formData: FormData): Promise<{ success: boolean; errors?: any; message?: string }> {
    const validatedFields = updateAdminCredentialsSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors };
    }

    const { loggedInAdminId, verificationUid, currentPassword, newAdminId, newPassword } = validatedFields.data;

    const admins = await getAdmins();
    const loggedInAdmin = admins.find(a => a.id === loggedInAdminId);
    
    if (!loggedInAdmin || loggedInAdmin.role !== 'Admin') {
        return { success: false, message: "You are not authorized to perform this action." };
    }
    
    const mainAdmin = admins.find(a => a.role === 'Admin');
    if (!mainAdmin) {
        return { success: false, message: "Main admin account not found." };
    }

    if (verificationUid !== mainAdmin.id) {
      return { success: false, message: "The Verification UID is incorrect. Please verify and try again." };
    }

    if (currentPassword !== mainAdmin.password) {
        return { success: false, message: "Current Password is incorrect.", errors: { currentPassword: ["Current Password is incorrect."] } };
    }

    const isNewIdTaken = admins.some(a => a.id === newAdminId && a.id !== mainAdmin.id);
    if (isNewIdTaken) {
        return { success: false, errors: { newAdminId: ["This Admin ID is already taken by another admin."] } };
    }

    try {
        await updateAdmin(mainAdmin.id, { id: newAdminId, password: newPassword });
        await addAuditLog({
            action: 'UPDATE',
            entityType: 'ADMIN',
            entityId: mainAdmin.id,
            adminId: loggedInAdminId,
            details: `Main admin credentials changed. New ID: ${newAdminId}.`,
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/admins');
        revalidatePath('/login');

        // Force logout by removing the cookie client-side
        return { success: true, message: "Admin ID and Password changed successfully. Please log in again with your new credentials." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to update credentials: ${message}` };
    }
}


const updateEventsManagerSchema = z.object({
    loggedInAdminId: z.string().min(1),
    managerAdminId: z.string().min(1, { message: "Manager ID is missing." }),
    newAdminId: z.string().min(1, { message: "New Login ID is required." }),
    newPassword: z.string().optional(),
});

export async function updateEventsManagerAction(prevState: any, formData: FormData): Promise<{ success: boolean; errors?: any; message?: string }> {
    const validatedFields = updateEventsManagerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const { loggedInAdminId, managerAdminId, newAdminId, newPassword } = validatedFields.data;

    const admins = await getAdmins();
    const loggedInAdmin = admins.find(a => a.id === loggedInAdminId);
    
    if (!loggedInAdmin || loggedInAdmin.role !== 'Admin') {
        return { success: false, message: "You are not authorized to perform this action." };
    }
    
    const managerToUpdate = admins.find(a => a.id === managerAdminId);
    if (!managerToUpdate) {
        return { success: false, message: "The Events Manager account to update was not found." };
    }

    if (managerToUpdate.role === 'Admin') {
         return { success: false, message: "You cannot edit the Main Admin's credentials here." };
    }

    const isNewIdTaken = admins.some(a => a.id.toLowerCase() === newAdminId.toLowerCase() && a.id !== managerAdminId);
    if (isNewIdTaken) {
        return { success: false, errors: { newAdminId: ["This Admin ID is already taken."] } };
    }
    
    const updatePayload: Partial<Admin> = { id: newAdminId };
    if (newPassword && newPassword.trim() !== '') {
        updatePayload.password = newPassword;
    }

    try {
        await updateAdmin(managerAdminId, updatePayload);

        await addAuditLog({
            action: 'UPDATE',
            entityType: 'ADMIN',
            entityId: managerAdminId,
            adminId: loggedInAdminId,
            details: `Events Manager ${managerToUpdate.name} (${managerAdminId}) credentials updated. New ID: ${newAdminId}.`,
        });

        revalidatePath('/admin/admins');

        return { success: true, message: "Events Manager credentials updated successfully." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to update credentials: ${message}` };
    }
}

