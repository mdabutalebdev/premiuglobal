/**
 * Inline "No Image" placeholder as an SVG data URI. Used as the fallback for
 * product/cart thumbnails. Being a data URI it never hits the network — the old
 * via.placeholder.com fallback failed offline and flooded the console with
 * ERR_CONNECTION_CLOSED errors.
 */
export const NO_IMAGE =
    "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='300'%20height='300'%3E%3Crect%20width='300'%20height='300'%20fill='%23f3f4f6'/%3E%3Ctext%20x='150'%20y='158'%20font-family='sans-serif'%20font-size='20'%20fill='%239ca3af'%20text-anchor='middle'%3ENo%20Image%3C/text%3E%3C/svg%3E";
