
export const    BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled', 'no_show'],
    'completed': [],
    'cancelled': [],
    'no_show': []
};

export const PAYMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
    'unpaid': ['paid', 'partial'],
    'partial': ['paid'],
    'paid': ['refunded'],
    'refunded': [] 
};