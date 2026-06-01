/** Customer may cancel before kitchen starts preparing */
export const CUSTOMER_CANCELLABLE = ['placed', 'confirmed']

/** Kitchen/admin may cancel up to and including preparing */
export const STAFF_CANCELLABLE = ['placed', 'confirmed', 'preparing']

export const canCustomerCancel = (status) => CUSTOMER_CANCELLABLE.includes(status)

export const canStaffCancel = (status) => STAFF_CANCELLABLE.includes(status)
