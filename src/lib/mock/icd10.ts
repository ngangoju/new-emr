
export interface ICD10Code {
  code: string
  name: string
  category: string
}

export const mockICD10: ICD10Code[] = [
  {
    code: 'A00.0',
    name: 'Cholera due to Vibrio cholerae 01, biovar cholerae',
    category: 'Certain infectious and parasitic diseases',
  },
  {
    code: 'J45.909',
    name: 'Unspecified asthma, uncomplicated',
    category: 'Diseases of the respiratory system',
  }
]