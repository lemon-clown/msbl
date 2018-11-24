/**
 * to upper camel-case.
 * @param text
 */
export const toUpperCamelCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)


/**
 * to lower camel-case.
 * @param text
 */
export const toLowerCamelCase = (text: string) => text.charAt(0).toLocaleLowerCase() + text.slice(1)
