export const coverBoolean = (defaultValue: boolean, optionValue?: boolean): boolean => {
  if (typeof optionValue === 'boolean') return optionValue
  return defaultValue
}


export const coverString = (defaultValue: string, optionValue?: string): string => {
  if (typeof optionValue === 'string') return optionValue || defaultValue
  return defaultValue
}
